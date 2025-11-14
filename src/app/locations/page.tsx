import { redirect } from "next/navigation";

export default function LocationsIndexRedirect() {
  // Redirect /locations to home
  redirect("/");
}
