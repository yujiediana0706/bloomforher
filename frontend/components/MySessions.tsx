import React, { useState } from 'react';
import { 
  Calendar, 
  Video, 
  CheckCircle2, 
  Star, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Award, 
  AlertCircle 
} from 'lucide-react';
import { Booking, EvidenceItem } from '../types';

interface Props {
  bookings: Booking[];
  onConfirmRelease: (bookingId: string) => void;
  onSubmitReview: (bookingId: string, rating: number, comment: string) => void;
  onMentorConfirm: (bookingId: string) => void;
}

export const MySessions: React.FC<Props> = ({
  bookings,
  onConfirmRelease,
  onSubmitReview,
  onMentorConfirm
}) => {
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('Clara provided transformative advice on translating my education SOPs into prompt flows!');

  const handleReviewSubmit = () => {
    if (!selectedBookingForReview || reviewComment.length < 5) return;
    onSubmitReview(selectedBookingForReview, reviewRating, reviewComment);
    setSelectedBookingForReview(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Session Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateblue-900">
            My Free Mentoring Sessions
          </h2>
          <p className="text-xs sm:text-sm text-slateblue-700 mt-1 max-w-2xl">
            State Machine: held → confirmed (meeting link visible) → completed → released (unlocks review & mentor endorsement evidence).
          </p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const isHeld = booking.status === 'held';
          const isConfirmed = booking.status === 'confirmed';
          const isReleased = booking.status === 'released';

          return (
            <div
              key={booking.id}
              className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <img
                  src={booking.mentorAvatar}
                  alt={booking.mentorName}
                  className="w-14 h-14 rounded-2xl object-cover border border-silver-300 shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slateblue-900 text-base">{booking.mentorName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isReleased 
                        ? 'bg-warmgreen/20 text-warmgreen' 
                        : isConfirmed 
                        ? 'bg-slateblue-900 text-white' 
                        : 'bg-silver-200 text-slateblue-800'
                    }`}>
                      Status: {booking.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-silver-600 font-medium">{booking.mentorTitle}</p>
                  <p className="text-xs text-slateblue-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-coral-500" />
                    {booking.scheduledTime}
                  </p>
                  <p className="text-xs text-slateblue-700 mt-1 italic">
                    Topic: "{booking.topic}"
                  </p>

                  {/* Meeting Link (Only visible after confirmed or released) */}
                  {(isConfirmed || isReleased) && booking.meetingLink && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-silver-100 text-xs font-bold text-slateblue-900 border border-silver-300">
                      <Video className="w-3.5 h-3.5 text-coral-500" />
                      <span>Meeting: </span>
                      <a href={booking.meetingLink} target="_blank" rel="noreferrer" className="text-coral-500 underline">
                        {booking.meetingLink}
                      </a>
                    </div>
                  )}

                  {/* Mentor Endorsement Quote */}
                  {booking.endorsement && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-softpink-100/70 to-silver-100 rounded-xl border border-silver-300 text-xs text-slateblue-900 font-medium">
                      <span className="font-bold text-coral-600 block mb-0.5">Mentor Endorsement Artifact:</span>
                      "{booking.endorsement}"
                    </div>
                  )}
                </div>
              </div>

              {/* Actions based on status */}
              <div className="flex flex-col gap-2 shrink-0 self-end md:self-center">
                {isHeld && (
                  <button
                    type="button"
                    onClick={() => onMentorConfirm(booking.id)}
                    className="px-4 py-2 bg-slateblue-900 hover:bg-slateblue-800 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Mentor Confirm (Demo)
                  </button>
                )}

                {isConfirmed && (
                  <button
                    type="button"
                    onClick={() => onConfirmRelease(booking.id)}
                    className="px-4 py-2 bg-warmgreen hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Confirm Session Completed
                  </button>
                )}

                {isReleased && !booking.review && (
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForReview(booking.id)}
                    className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Write Review
                  </button>
                )}

                {isReleased && booking.review && (
                  <div className="text-xs text-warmgreen font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reviewed & Endorsed</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slateblue-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-silver-300 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slateblue-900">Review Your Free Mentorship</h3>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-coral-500"
                  >
                    <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-coral-500' : 'text-silver-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Comment (min 5 characters)</label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-silver-400 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-silver-200">
              <button
                type="button"
                onClick={() => setSelectedBookingForReview(null)}
                className="px-4 py-2 text-xs font-semibold text-silver-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                className="px-5 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Submit Review & Unlock Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
