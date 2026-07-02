import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import Navbar from '../../components/layout/Navbar';
import { useConfirm } from '../../components/ui/ConfirmModal';

// ── Types ──────────────────────────────────────────────
interface Author { id: string; nickname: string }
interface Post {
  id: string;
  content: string | null;
  tag: string;
  author: Author;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  edited?: boolean;
  deleted?: boolean;
}
interface Comment {
  id: string;
  content: string | null;
  author: Author;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  edited?: boolean;
  deleted?: boolean;
}

// ── Constants ──────────────────────────────────────────
const TAG_FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'STOCK', label: '주식' },
  { value: 'COIN', label: '코인' },
  { value: 'PENSION', label: '연금' },
  { value: 'FREE', label: '자유' },
];

const TAG_META: Record<string, { label: string; color: string }> = {
  STOCK:   { label: '주식',   color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  COIN:    { label: '코인',   color: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  PENSION: { label: '연금',   color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  FREE:    { label: '자유',   color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

// ── Helpers ────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 절대 일시 (예: 2026. 7. 2. 14:30) — 수정/삭제 일시 표시용
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Avatar({ nickname, size = 'sm' }: { nickname: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {nickname?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ── Write Modal ────────────────────────────────────────
function WriteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (p: Post) => void }) {
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('FREE');

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/community/posts', { content: content.trim(), tag }).then((r) => r.data),
    onSuccess: (post: Post) => {
      onSuccess(post);
      onClose();
    },
  });

  const tags = TAG_FILTERS.filter((t) => t.value !== 'ALL');

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full sm:max-w-lg bg-[#111318] rounded-t-3xl sm:rounded-2xl border border-white/[0.07] p-5 z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-[15px]">글 작성</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 태그 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {tags.map((t) => (
            <button
              key={t.value}
              onClick={() => setTag(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                tag === t.value
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 내용 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="투자 이야기, 궁금한 점, 정보를 공유해보세요..."
          maxLength={500}
          rows={5}
          className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/40 resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-slate-600 text-xs">{content.length} / 500</span>
          <button
            onClick={() => mutate()}
            disabled={!content.trim() || isPending}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition"
          >
            {isPending ? '게시 중...' : '게시하기'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Single Comment Row ─────────────────────────────────
function CommentRow({ postId, comment }: { postId: string; comment: Comment }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isMine = currentUserId === comment.author.id;
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content ?? '');

  const { mutate: updateComment, isPending: updating } = useMutation({
    mutationFn: (content: string) =>
      api
        .patch(`/community/posts/${postId}/comments/${comment.id}`, { content })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      setEditing(false);
    },
  });

  const { mutate: deleteComment } = useMutation({
    mutationFn: () =>
      api.delete(`/community/posts/${postId}/comments/${comment.id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  // 삭제된 댓글: 자리는 남기고 내용만 가린다
  if (comment.deleted) {
    return (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-white/[0.03] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-600 text-xs italic mt-1.5">삭제된 댓글입니다</p>
          {comment.deletedAt && (
            <span className="text-slate-700 text-[10px]">
              삭제됨 · {formatDateTime(comment.deletedAt)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 group/comment">
      <Avatar nickname={comment.author.nickname} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-slate-200 text-xs font-semibold">{comment.author.nickname}</span>
          <span className="text-slate-600 text-[10px]">{timeAgo(comment.createdAt)}</span>
          {comment.edited && (
            <span className="text-slate-600 text-[10px]">· 수정됨</span>
          )}
          {isMine && !editing && (
            <span className="ml-auto flex gap-2 opacity-0 group-hover/comment:opacity-100 transition">
              <button
                onClick={() => { setDraft(comment.content ?? ''); setEditing(true); }}
                className="text-slate-500 hover:text-indigo-400 text-[10px]"
              >
                수정
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: '댓글을 삭제할까요?',
                    message: '삭제된 댓글은 되돌릴 수 없어요.',
                    confirmText: '삭제',
                    variant: 'danger',
                  });
                  if (ok) deleteComment();
                }}
                className="text-slate-500 hover:text-rose-400 text-[10px]"
              >
                삭제
              </button>
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-1 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              autoFocus
              className="flex-1 bg-[#1a1d27] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/30"
            />
            <button
              onClick={() => draft.trim() && updateComment(draft.trim())}
              disabled={!draft.trim() || updating}
              className="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-[11px] font-medium rounded-lg transition"
            >
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-1.5 text-slate-500 hover:text-white text-[11px] transition"
            >
              취소
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{comment.content}</p>
            {comment.edited && comment.updatedAt && (
              <span className="text-slate-700 text-[10px]">
                수정됨 · {formatDateTime(comment.updatedAt)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Comment Section ────────────────────────────────────
function CommentSection({ postId }: { postId: string }) {
  const [input, setInput] = useState('');
  const qc = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/community/posts/${postId}/comments`).then((r) => r.data),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (content: string) =>
      api.post(`/community/posts/${postId}/comments`, { content }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      setInput('');
    },
  });

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06]">
      {isLoading ? (
        <div className="h-3 bg-white/5 rounded w-24 animate-pulse mb-2" />
      ) : (
        <div className="space-y-2.5 mb-3">
          {comments.map((c) => (
            <CommentRow key={c.id} postId={postId} comment={c} />
          ))}
          {comments.length === 0 && (
            <p className="text-slate-600 text-xs">첫 댓글을 남겨보세요</p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); mutate(input.trim()); } }}
          placeholder="댓글 입력..."
          maxLength={200}
          className="flex-1 bg-[#1a1d27] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500/30"
        />
        <button
          onClick={() => input.trim() && mutate(input.trim())}
          disabled={!input.trim() || isPending}
          className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-medium rounded-xl transition"
        >
          등록
        </button>
      </div>
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isMine = currentUserId === post.author.id;
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content ?? '');

  const { mutate: toggleLike } = useMutation({
    mutationFn: () => api.post(`/community/posts/${post.id}/like`).then((r) => r.data),
    onMutate: () => {
      setLiked((v) => !v);
      setLikeCount((v) => liked ? v - 1 : v + 1);
    },
    onError: () => {
      setLiked((v) => !v);
      setLikeCount(post.likeCount);
    },
  });

  const invalidatePosts = () =>
    qc.invalidateQueries({ queryKey: ['community-posts'] });

  const { mutate: updatePost, isPending: updating } = useMutation({
    mutationFn: (content: string) =>
      api.patch(`/community/posts/${post.id}`, { content }).then((r) => r.data),
    onSuccess: () => {
      invalidatePosts();
      setEditing(false);
    },
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: () => api.delete(`/community/posts/${post.id}`).then((r) => r.data),
    onSuccess: invalidatePosts,
  });

  const meta = TAG_META[post.tag] ?? TAG_META.FREE;
  const content = post.content ?? '';

  // 삭제된 게시글: 자리는 남기고 내용만 placeholder로 가린다
  if (post.deleted) {
    return (
      <motion.div
        layout
        className="bg-[#0d0f14] border border-white/[0.04] rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/[0.03] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-slate-600 text-sm italic">삭제된 게시글입니다</p>
            {post.deletedAt && (
              <span className="text-slate-700 text-[11px]">
                삭제됨 · {formatDateTime(post.deletedAt)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="bg-[#111318] border border-white/[0.06] hover:border-white/[0.1] rounded-2xl p-4 transition-colors"
    >
      {/* 작성자 + 태그 */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar nickname={post.author.nickname} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{post.author.nickname}</span>
              <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${meta.color}`}>
                {meta.label}
              </span>
              {post.edited && (
                <span className="text-slate-600 text-[10px]">· 수정됨</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-slate-600 text-[11px]">{timeAgo(post.createdAt)}</span>
              {isMine && !editing && (
                <>
                  <button
                    onClick={() => { setDraft(content); setEditing(true); }}
                    className="text-slate-500 hover:text-indigo-400 text-[11px] transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: '게시글을 삭제할까요?',
                        message: '삭제된 게시글은 되돌릴 수 없어요.',
                        confirmText: '삭제',
                        variant: 'danger',
                      });
                      if (ok) deletePost();
                    }}
                    className="text-slate-500 hover:text-rose-400 text-[11px] transition"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <div className="mb-3">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              rows={4}
              autoFocus
              className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/40 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-slate-500 hover:text-white text-xs transition"
              >
                취소
              </button>
              <button
                onClick={() => draft.trim() && updatePost(draft.trim())}
                disabled={!draft.trim() || updating}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition"
              >
                {updating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap ${!contentExpanded ? 'line-clamp-4' : ''}`}>
              {content}
            </p>
            {content.split('\n').length > 4 || content.length > 200 ? (
              <button
                onClick={() => setContentExpanded((v) => !v)}
                className="text-indigo-400/70 text-xs mt-1 hover:text-indigo-400 transition"
              >
                {contentExpanded ? '접기' : '더보기'}
              </button>
            ) : null}
            {post.edited && post.updatedAt && (
              <p className="text-slate-700 text-[10px] mt-1.5">
                수정됨 · {formatDateTime(post.updatedAt)}
              </p>
            )}
          </>
        )}
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => toggleLike()}
          className="flex items-center gap-1.5 group"
        >
          <motion.svg
            className={`w-4 h-4 transition-colors ${liked ? 'text-rose-400' : 'text-slate-600 group-hover:text-slate-400'}`}
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={liked ? 0 : 2}
            animate={liked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </motion.svg>
          <span className={`text-xs font-medium transition-colors ${liked ? 'text-rose-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
            {likeCount}
          </span>
        </motion.button>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 group"
        >
          <svg
            className={`w-4 h-4 transition-colors ${expanded ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span className={`text-xs font-medium transition-colors ${expanded ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
            {post.commentCount}
          </span>
        </button>
      </div>

      {/* 댓글 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <CommentSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────
function EmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-indigo-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <p className="text-slate-300 font-medium mb-1">아직 글이 없어요</p>
      <p className="text-slate-600 text-sm mb-5">첫 번째 이야기를 시작해보세요</p>
      <button
        onClick={onWrite}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
      >
        글 작성하기
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function CommunityPage() {
  const [activeTag, setActiveTag] = useState('ALL');
  const [showWrite, setShowWrite] = useState(false);
  const qc = useQueryClient();

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['community-posts', activeTag],
    queryFn: () =>
      api.get('/community/posts', { params: { tag: activeTag } }).then((r) => r.data),
    staleTime: 10000,
  });

  const handleNewPost = useCallback((post: Post) => {
    qc.setQueryData<Post[]>(['community-posts', 'ALL'], (old = []) => [post, ...old]);
    qc.setQueryData<Post[]>(['community-posts', post.tag], (old = []) => [post, ...old]);
    setActiveTag('ALL');
  }, [qc]);

  return (
    <div className="min-h-dvh bg-[#08090d]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-16 pb-28 md:pb-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-4 mb-5"
        >
          <div>
            <h1 className="text-xl font-bold text-white">커뮤니티</h1>
            <p className="text-slate-500 text-sm mt-0.5">투자 이야기를 나눠보세요</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWrite(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            글쓰기
          </motion.button>
        </motion.div>

        {/* 태그 필터 */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar"
        >
          {TAG_FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTag(t.value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeTag === t.value
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-[#111318] text-slate-400 border-white/[0.07] hover:border-white/[0.15]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* 피드 */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#111318] border border-white/[0.06] rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-24" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState onWrite={() => setShowWrite(true)} />
        ) : (
          <motion.div
            key={activeTag}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* 글 작성 모달 */}
      <AnimatePresence>
        {showWrite && (
          <WriteModal
            onClose={() => setShowWrite(false)}
            onSuccess={handleNewPost}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
