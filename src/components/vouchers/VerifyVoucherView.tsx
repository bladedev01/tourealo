"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { verifyBookingByCode, redeemBooking, type VerifyVoucherResponse } from "@/services/bookings";

export type VerifyVoucherViewProps = {
  code: string;
};

export function VerifyVoucherView({ code }: VerifyVoucherViewProps) {
  const { t } = useTranslation("frontend-voucher");
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerifyVoucherResponse | null>(null);
  const [needPin, setNeedPin] = useState(false);
  const [pinInvalid, setPinInvalid] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const canRedeemUI = useMemo(() => {
    const role = String((user as any)?.role || "").toLowerCase();
    return Boolean(data?.ok && data?.canRedeem && (role === "supplier" || role === "admin"));
  }, [data, user]);

  const load = async (pinValue?: string) => {
    if (!code) {
      setError(t("errors.missingCode", "Falta código"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setPinInvalid(false);
    try {
      const response = await verifyBookingByCode(code, pinValue);
      if (response.needPin) {
        setNeedPin(true);
        setData(null);
      } else {
        setNeedPin(false);
        setData(response);
      }
    } catch (err: any) {
      if (err?.payload?.pinInvalid || err?.pinInvalid) {
        setPinInvalid(true);
        setNeedPin(true);
      } else {
        const message = err?.message || t("errors.verify", "No se pudo verificar el voucher");
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const onSubmitPin: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    void load(pin);
  };

  const onRedeem = async () => {
    if (!data?.booking?.id) return;
    setRedeeming(true);
    try {
      const result = await redeemBooking(data.booking.id);
      setData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          redeemed: true,
          canRedeem: false,
          booking: {
            ...previous.booking,
            redeemedAt: result.redeemedAt ?? result.booking?.redeemedAt ?? new Date().toISOString(),
            status: result.status ?? previous.booking?.status,
          },
        };
      });
    } catch (err: any) {
      setError(err?.message || t("errors.redeem", "No se pudo canjear el voucher"));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="bg-slate-50 py-16">
      <div className="mx-auto w-full max-w-xl px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-slate-900">{t("title", "Verificación de voucher")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t("subtitle", "Confirma el estado del código para validar la reserva." )}
          </p>

          {loading && (
            <div className="mt-6 text-sm text-slate-500">{t("state.loading", "Verificando...")}</div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
          )}

          {!loading && needPin && (
            <form onSubmit={onSubmitPin} className="mt-6 space-y-3">
              <div>
                <label htmlFor="pin" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {t("pin.label", "PIN requerido")}
                </label>
                <input
                  id="pin"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder={t("pin.placeholder", "Introduce tu PIN")}
                />
                {pinInvalid && (
                  <p className="mt-2 text-xs text-rose-600">{t("pin.invalid", "PIN inválido")}</p>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {t("actions.verify", "Verificar")}
              </button>
            </form>
          )}

          {!loading && data?.ok && data.booking && (
            <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{data.booking.productTitle || data.booking.tour?.name || t("details.title", "Reserva")}</h2>
                <p className="text-sm text-slate-600">
                  <span className="font-mono text-xs text-slate-500">{t("details.code", "Código")}: {data.booking.code}</span>
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.date", "Fecha")}</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {data.booking.date ? new Date(data.booking.date).toLocaleString() : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.persons", "Personas")}</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {data.booking.persons} ({t("details.adults", "Adultos")}: {data.booking.adults ?? 0} · {t("details.children", "Niños")}: {data.booking.children ?? 0})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.status", "Estado")}</dt>
                  <dd className="mt-1 font-semibold text-emerald-600">{data.booking.status}</dd>
                </div>
                {data.booking.redeemedAt && (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("details.redeemed", "Canjeado")}</dt>
                    <dd className="mt-1 font-medium text-slate-800">{new Date(data.booking.redeemedAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>

              {canRedeemUI && (
                <button
                  onClick={onRedeem}
                  disabled={redeeming}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {redeeming ? t("actions.redeeming", "Canjeando...") : t("actions.redeem", "Canjear ahora")}
                </button>
              )}

              {!canRedeemUI && data.canRedeem && (
                <p className="text-xs text-slate-500">{t("notes.loginSupplier", "Inicia sesión como proveedor para canjear.")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
