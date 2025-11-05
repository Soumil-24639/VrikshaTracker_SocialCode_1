import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { useDbData } from '../hooks/useGeolocation';
import { User, SocialPost, Challenge } from '../types';
import { CameraIcon, PaperAirplaneIcon, HeartIcon, MessageCircleIcon, SparklesIcon } from './icons';
import { generatePostCaption } from '../services/geminiService';

// --- Helper Components ---

const UserAvatar: React.FC<{ user?: User }> = ({ user }) => (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mint-green to-forest-green flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
        {user ? user.name.charAt(0) : '?'}
    </div>
);

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

// --- Main Social Components ---

const CreatePostForm: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSuggestCaption = async () => {
        if (!image) return;
        setIsGeneratingCaption(true);
        const suggestion = await generatePostCaption(image);
        setCaption(suggestion);
        setIsGeneratingCaption(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!caption.trim() && !image) || isSubmitting) return;

        setIsSubmitting(true);
        db.createSocialPost({ userId: currentUser.id, caption, image: image! });
        
        // Reset form
        setCaption('');
        setImage(null);
        setPreviewUrl(null);
        setIsSubmitting(false);
    };

    return (
        <div className="bg-glass p-4 rounded-xl shadow-md mb-8">
            <form onSubmit={handleSubmit}>
                <div className="flex items-start space-x-4">
                    <UserAvatar user={currentUser} />
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full h-24 p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green transition-all resize-none"
                        placeholder="🌿 What's growing on?"
                    />
                </div>
                {previewUrl && (
                    <div className="mt-4 pl-16">
                        <img src={previewUrl} alt="Post preview" className="rounded-lg max-h-40 object-contain" />
                    </div>
                )}
                <div className="flex justify-between items-center mt-4 pl-16 flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <input type="file" id="postImage" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <label htmlFor="postImage" className="flex items-center text-forest-green dark:text-mint-green cursor-pointer hover:opacity-80">
                            <CameraIcon className="w-6 h-6 mr-2" />
                            <span>{image ? "Change Photo" : "Add Photo"}</span>
                        </label>
                        {image && (
                            <button type="button" onClick={handleSuggestCaption} disabled={isGeneratingCaption} className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-semibold disabled:opacity-50">
                                <SparklesIcon className={`w-5 h-5 mr-1 ${isGeneratingCaption ? 'animate-pulse' : ''}`}/>
                                {isGeneratingCaption ? 'Generating...' : 'Suggest Caption'}
                            </button>
                        )}
                    </div>
                    <button type="submit" disabled={!image || isSubmitting} className="flex items-center btn-gradient text-white font-bold py-2 px-5 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                        {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const ChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => (
    <div className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 dark:from-yellow-600 dark:via-yellow-500 dark:to-yellow-400 p-5 rounded-xl shadow-lg mb-8 text-white relative overflow-hidden">
        <SparklesIcon className="absolute -right-4 -top-4 w-24 h-24 text-white/20 transform rotate-12" />
        <h3 className="text-xl font-bold text-yellow-900 dark:text-white">🏆 Weekly Challenge!</h3>
        <p className="font-semibold mt-1">{challenge.title}</p>
        <p className="text-sm mt-2">{challenge.description}</p>
        <div className="mt-3 text-xs font-bold bg-white/30 rounded-full px-3 py-1 inline-block">
            + {challenge.points} Eco Points
        </div>
    </div>
);


const PostCard: React.FC<{ post: SocialPost; currentUser: User; users: Map<string, User> }> = ({ post, currentUser, users }) => {
    const author = users.get(post.userId);
    const hasLiked = useMemo(() => post.likes.some(like => like.userId === currentUser.id), [post.likes, currentUser.id]);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    const handleLike = () => db.toggleLike(post.id, currentUser.id);

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        db.addComment(post.id, currentUser.id, commentText);
        setCommentText('');
    };
    
    return (
        <div className="bg-glass p-5 rounded-xl shadow-md">
            {/* Post Header */}
            <div className="flex items-center mb-4">
                <UserAvatar user={author} />
                <div className="ml-4">
                    <p className="font-bold text-gray-800 dark:text-white">{author?.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeSince(post.timestamp)}</p>
                </div>
            </div>

            {/* Post Content */}
            <p className="mb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.caption}</p>
            {post.imageUrl && (
                <img src={post.imageUrl} alt="Sapling post" className="w-full rounded-lg object-cover max-h-[500px]" />
            )}

            {/* Post Actions */}
            <div className="flex justify-around items-center mt-4 border-t border-b border-gray-200/50 dark:border-gray-700/50 py-2">
                <button onClick={handleLike} className={`flex items-center space-x-2 text-sm font-semibold transition-colors duration-200 ${hasLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>
                    <HeartIcon className="w-6 h-6" isFilled={hasLiked} /> 
                    <span>{post.likes.length} Like{post.likes.length !== 1 && 's'}</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-forest-green dark:hover:text-mint-green">
                    <MessageCircleIcon className="w-6 h-6" /> 
                    <span>{post.comments.length} Comment{post.comments.length !== 1 && 's'}</span>
                </button>
            </div>
            
            {/* Comments Section */}
            {showComments && (
                 <div className="mt-4 space-y-3">
                    {post.comments.map(comment => {
                        const commenter = users.get(comment.userId);
                        return (
                            <div key={comment.id} className="flex items-start space-x-3 text-sm">
                                <div className="w-8 h-8 mt-1 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                                    {commenter?.name.charAt(0)}
                                </div>
                                <div className="flex-1 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg p-2">
                                    <p>
                                        <span className="font-bold mr-2 text-gray-800 dark:text-white">{commenter?.name}</span>
                                        <span className="text-gray-600 dark:text-gray-300">{comment.text}</span>
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                     <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3 pt-2">
                         <div className="w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">
                            {currentUser.name.charAt(0)}
                         </div>
                         <input
                            type="text"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-600/50 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green"
                         />
                         <button type="submit" className="p-2 bg-forest-green rounded-full text-white hover:bg-gradient-end disabled:bg-gray-400" disabled={!commentText.trim()}>
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                     </form>
                 </div>
            )}
        </div>
    );
};


export const SocialFeed: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const socialPosts = useDbData(db.getSocialFeed);
    const challenges = useDbData(db.getChallenges);
    const allUsers = useDbData(db.getAllUsers);

    const usersMap = useMemo(() => {
        return new Map<string, User>(allUsers.map(user => [user.id, user]));
    }, [allUsers]);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <CreatePostForm currentUser={currentUser} />

                {challenges.length > 0 && <ChallengeCard challenge={challenges[0]} />}

                <div className="space-y-6">
                    {socialPosts.map(post => (
                        <PostCard key={post.id} post={post} currentUser={currentUser} users={usersMap} />
                    ))}
                </div>
            </div>
        </div>
    );
};
