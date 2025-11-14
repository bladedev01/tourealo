import React from "react";

interface Review {
  user: string;
  rating: number;
  comment: string;
}

interface TourReviewsProps {
  reviews: Review[];
}

const TourReviews: React.FC<TourReviewsProps> = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return <div>No hay reseñas aún.</div>;
  return (
    <div className="space-y-4">
      {reviews.map((review, idx) => (
        <div key={idx} className="p-4 bg-gray-50 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{review.user}</span>
            <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
          </div>
          <div className="text-gray-700">{review.comment}</div>
        </div>
      ))}
    </div>
  );
};

export default TourReviews;
