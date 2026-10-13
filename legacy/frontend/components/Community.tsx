import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  HeartHandshake, 
  MessageSquare, 
  Award, 
  Share2, 
  Flag, 
  CheckCircle2, 
  Star,
  Clock,
  UserPlus
} from 'lucide-react';
import { MentorProfile, MentorSlot, CirclePost, UserProfile, Booking, EvidenceItem } from '../types';

interface Props {
  mentors: MentorProfile[];
  posts: CirclePost[];
  user: UserProfile;
  onBookSlot: (mentor: MentorProfile, slot: MentorSlot, topic: string) => void;
  onCheerPost: (postId: string) => void;
  onCreatePost: (post: Omit<CirclePost, 'id' | 'createdAt' | 'cheers' | 'cheeredBy' | 'commentsCount'>) => void;
  onReportContent: (targetId: string, reason: string) => void;
}

export const Community: React.FC<Props> = ({
  mentors,
  posts,
  user,
  onBookSlot,
  onCheerPost,
  onCreatePost,
  onReportContent
}) => {
  const [activeTab, setActiveTab] = useState<'mentors' | 'circles'>('mentors');
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MentorSlot | null>(null);
  const [bookingTopic, setBookingTopic] = useState('Career gap framing & AI Operations guidance');

  // Peer Circle Post Creation Modal
  const [newPostModal, setNewPostModal] = useState(false);
  const [newPostType, setNewPostType] = useState<'qa' | 'opportunity' | 'win' | 'cheer'>('win');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  const handleBookingSubmit = () => {
    if (!selectedMentor || !selectedSlot) return;
    onBookSlot(selectedMentor, selectedSlot, bookingTopic);
    setSelectedMentor(null);
    setSelectedSlot(null);
  };

  const handleCreatePostSubmit = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    onCreatePost({
      authorId: user.uid,
      authorName: user.name,
      authorAvatar: user.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      authorStage: user.lifeStage,
      type: newPostType,
      title: newPostTitle,
      content: newPostContent,
      tags: ['Community', newPostType.toUpperCase()]
    });
    setNewPostModal(false);
    setNewPostTitle('');
    setNewPostContent('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Journey ⑥ · Bilateral Female Community</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateblue-900">
            Mentorship & Peer Circles
          </h2>
          <p className="text-xs sm:text-sm text-slateblue-700 mt-1 max-w-2xl">
            100% Free · Community-supported mentoring. Zero payment or charge concepts exist in our platform — pure social good.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-silver-100 p-1 rounded-xl border border-silver-300">
          <button
            type="button"
            onClick={() => setActiveTab('mentors')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mentors' ? 'bg-white text-slateblue-900 shadow-sm' : 'text-silver-600 hover:text-slateblue-900'
            }`}
          >
            Verified Mentors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('circles')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'circles' ? 'bg-white text-slateblue-900 shadow-sm' : 'text-silver-600 hover:text-slateblue-900'
            }`}
          >
            Peer Circles ({posts.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Mentors List */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-softpink-100/70 to-silver-100 border border-silver-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-warmgreen/20 text-warmgreen flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slateblue-900 block">5-Session Support Package (Free):</span>
                <span className="text-slateblue-700">You have {user.remainingRedemptions} redemptions remaining. Rejections automatically return redemptions.</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-white rounded-xl text-xs font-black text-coral-500 border border-silver-300 shadow-sm">
              Free · Community-supported
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col justify-between hover:border-coral-500/50 transition-all"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-4">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-silver-300 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-slateblue-900 text-base">{mentor.name}</h4>
                        {mentor.isVerified && (
                          <span title="Verified Mentor" className="text-slateblue-900">
                            <ShieldCheck className="w-4 h-4 text-slateblue-900 fill-silver-300" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-silver-600 font-medium">{mentor.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slateblue-700">
                        <span className="flex items-center gap-0.5 text-coral-500 font-bold">
                          <Star className="w-3 h-3 fill-coral-500" />
                          {mentor.rating}
                        </span>
                        <span>•</span>
                        <span>{mentor.impactWomenCount} women accompanied</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slateblue-800 leading-relaxed mb-4">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {mentor.topics.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-silver-100 rounded-md text-[10px] font-semibold text-slateblue-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-silver-200">
                  <div className="flex items-center justify-between mb-3 text-[11px] text-silver-600">
                    <span className="font-semibold text-warmgreen">
                      {mentor.availableSlots.filter(s => s.status === 'available').length} slots available
                    </span>
                    <span className="font-bold text-coral-500">Free · Social Good</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setSelectedSlot(mentor.availableSlots[0]);
                    }}
                    className="w-full py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Free Session</span>
                  </button>
                  <p className="text-[10px] text-silver-600 text-center mt-1">
                    Free · Community-supported mentoring — no payment involved.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Peer Circles */}
      {activeTab === 'circles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slateblue-900 text-lg">Peer Circles Wall</h3>
            <button
              type="button"
              onClick={() => setNewPostModal(true)}
              className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              + Share Experience / Win
            </button>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-silver-300"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slateblue-900">{post.authorName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-silver-200 text-slateblue-800 font-bold">
                          {post.authorStage}
                        </span>
                      </div>
                      <span className="text-[10px] text-silver-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-softpink-100 text-coral-500 text-[11px] font-black uppercase">
                      {post.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => onReportContent(post.id, 'Inappropriate content')}
                      className="text-silver-400 hover:text-silver-600 p-1"
                      title="Report content"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-base text-slateblue-900">{post.title}</h4>
                <p className="text-xs text-slateblue-700 leading-relaxed">{post.content}</p>

                <div className="pt-3 border-t border-silver-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onCheerPost(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-silver-100 hover:bg-softpink-100 text-coral-500 font-bold transition-colors"
                    >
                      <span>👏 Cheer</span>
                      <span>({post.cheers})</span>
                    </button>

                    <span className="text-silver-600 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {post.commentsCount} comments
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onCheerPost(post.id);
                      alert(`Sent cheer & accountability request to @${post.authorName}!`);
                    }}
                    className="text-slateblue-900 hover:text-coral-500 font-bold text-xs flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Find as Peer Partner</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Slot Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slateblue-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-silver-300 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-silver-200">
              <div>
                <span className="text-[10px] font-bold text-coral-500 uppercase">Free 1:1 Mentorship</span>
                <h3 className="text-lg font-black text-slateblue-900">Book with {selectedMentor.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="text-silver-500 hover:text-slateblue-900 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-2">Select Available Slot:</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedMentor.availableSlots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`w-full p-3 rounded-xl text-left border text-xs flex items-center justify-between ${
                      selectedSlot?.id === s.id
                        ? 'border-coral-500 bg-softpink-100/50 font-bold'
                        : 'border-silver-300 hover:bg-silver-50'
                    }`}
                  >
                    <span>{s.startAt}</span>
                    <span className="text-warmgreen font-semibold">Free Slot</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">What would you like to discuss?</label>
              <textarea
                rows={3}
                value={bookingTopic}
                onChange={(e) => setBookingTopic(e.target.value)}
                className="w-full p-3 rounded-xl border border-silver-400 text-xs focus:ring-2 focus:ring-coral-500"
              />
            </div>

            <div className="p-3 bg-silver-50 rounded-xl text-[11px] text-slateblue-700">
              <strong>Social Impact Guarantee:</strong> All mentoring on Bloom AI is completely free. Cost will never be a barrier for a woman entering tech.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-silver-200">
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                className="px-4 py-2 text-xs font-semibold text-silver-600 hover:text-slateblue-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBookingSubmit}
                className="px-6 py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirm Free Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {newPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slateblue-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-silver-300 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slateblue-900">Share with the Peer Circle</h3>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Post Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(['win', 'qa', 'opportunity', 'cheer'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewPostType(t)}
                    className={`py-1.5 rounded-lg text-xs font-bold uppercase ${
                      newPostType === t ? 'bg-coral-500 text-white' : 'bg-silver-100 text-slateblue-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Title</label>
              <input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="e.g., Unlocked my first prompt evaluation score!"
                className="w-full px-3 py-2 rounded-xl border border-silver-400 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Your Story / Question</label>
              <textarea
                rows={4}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your breakthrough, challenge, or ask peers..."
                className="w-full p-3 rounded-xl border border-silver-400 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-silver-200">
              <button
                type="button"
                onClick={() => setNewPostModal(false)}
                className="px-4 py-2 text-xs font-semibold text-silver-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePostSubmit}
                className="px-6 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl"
              >
                Publish to Circle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
