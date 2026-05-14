import { useState } from 'react'
import type { Platform } from '../../types'

const BUSINESS_NAME = 'The Family Roofing Company'
const BUSINESS_LOGO = 'https://assets.cdn.filesafe.space/Gxry1a2QLdf9fdbKkdhz/media/69e3916a8696a78b8dddae2c.jpeg'
const IG_HANDLE = 'thefamilyroofingco'

interface MockupProps {
  caption: string
  imagePreviews: string[]
}

interface PostMockupProps extends MockupProps {
  platform: Platform
}


const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const CommentIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const SendIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const BookmarkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const ThumbsUpIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
)

const RepostIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
)

const ImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
    <span className="text-[11px]">No image</span>
  </div>
)

function MediaCarousel({ images, aspectRatio }: { images: string[]; aspectRatio: string }) {
  const [index, setIndex] = useState(0)
  const safeIndex = Math.min(index, Math.max(0, images.length - 1))

  if (images.length === 0) {
    return (
      <div className="bg-gray-100 overflow-hidden" style={{ aspectRatio }}>
        <ImagePlaceholder />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 overflow-hidden relative" style={{ aspectRatio }}>
      <img src={images[safeIndex]} alt={`Post ${safeIndex + 1}`} className="w-full h-full object-cover" />

      {images.length > 1 && (
        <>
          {safeIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIndex(safeIndex - 1) }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-800 transition-colors"
              aria-label="Previous image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {safeIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIndex(safeIndex + 1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-800 transition-colors"
              aria-label="Next image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold leading-none">
            {safeIndex + 1}/{images.length}
          </div>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === safeIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InstagramMockup({ caption, imagePreviews }: MockupProps) {
  return (
    <div className="bg-white text-gray-900 font-sans select-none">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-[2px] shrink-0" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
            <img src={BUSINESS_LOGO} alt={BUSINESS_NAME} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-[12px] leading-tight text-gray-900">{IG_HANDLE}</p>
            <p className="text-[10px] text-gray-400">Sponsored</p>
          </div>
        </div>
        <span className="text-gray-400 text-lg font-bold tracking-widest leading-none">···</span>
      </div>

      <MediaCarousel images={imagePreviews} aspectRatio="1/1" />

      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-gray-800">
        <div className="flex items-center gap-4">
          <HeartIcon />
          <CommentIcon />
          <SendIcon />
        </div>
        <BookmarkIcon />
      </div>

      <div className="px-3 pb-1">
        <p className="font-semibold text-[12px] text-gray-900">1,284 likes</p>
      </div>

      <div className="px-3 pb-3">
        <p className="text-[12px] leading-snug text-gray-800 whitespace-pre-wrap">
          <span className="font-semibold">{IG_HANDLE}</span>{' '}
          {caption}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">View all 24 comments</p>
      </div>
    </div>
  )
}

function FacebookMockup({ caption, imagePreviews }: MockupProps) {
  return (
    <div className="bg-white text-gray-900 font-sans select-none">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <img src={BUSINESS_LOGO} alt={BUSINESS_NAME} className="w-9 h-9 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-[#1877F2] leading-tight truncate">{BUSINESS_NAME}</p>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>Just now</span>
            <span>·</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13H9V9h2v6zm4 0h-2V9h2v6z" />
            </svg>
          </div>
        </div>
        <span className="text-gray-400 text-xl shrink-0">···</span>
      </div>

      <div className="px-3 pb-2.5">
        <p className="text-[13px] text-gray-800 leading-snug whitespace-pre-wrap">{caption}</p>
      </div>

      <MediaCarousel images={imagePreviews} aspectRatio="16/9" />

      <div className="px-3 py-1.5 flex items-center justify-between text-[12px] text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <span>👍</span><span>❤️</span>
          <span>42</span>
        </div>
        <div className="flex gap-2">
          <span>5 Comments</span>
          <span>·</span>
          <span>2 Shares</span>
        </div>
      </div>

      <div className="px-1 py-1 flex items-center justify-around text-[12px] text-gray-600 font-semibold">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <ThumbsUpIcon /><span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <CommentIcon size={16} /><span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <SendIcon size={16} /><span>Share</span>
        </button>
      </div>
    </div>
  )
}

function LinkedInMockup({ caption, imagePreviews }: MockupProps) {
  return (
    <div className="bg-white text-gray-900 font-sans select-none">
      <div className="flex items-start gap-2.5 px-3 py-3">
        <img src={BUSINESS_LOGO} alt={BUSINESS_NAME} className="w-10 h-10 rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-[13px] leading-tight truncate">{BUSINESS_NAME}</p>
            <span className="text-[11px] text-gray-400 shrink-0">· 1st</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight truncate">Roofing Specialists · 4,832 followers</p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
            <span>Just now</span>
            <span>·</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13H9V9h2v6zm4 0h-2V9h2v6z" />
            </svg>
          </div>
        </div>
        <button className="text-[#0A66C2] text-[12px] font-semibold border border-[#0A66C2] rounded-full px-3 py-0.5 shrink-0 hover:bg-blue-50 transition-colors">
          + Follow
        </button>
      </div>

      <div className="px-3 pb-2.5">
        <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{caption}</p>
      </div>

      <MediaCarousel images={imagePreviews} aspectRatio="16/9" />

      <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <span>👍</span><span>❤️</span><span>💡</span>
          <span>47 reactions</span>
        </div>
        <span>12 comments · 3 reposts</span>
      </div>

      <div className="px-1 py-1 flex items-center justify-around text-[12px] text-gray-600 font-semibold">
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <ThumbsUpIcon /><span>Like</span>
        </button>
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <CommentIcon size={16} /><span>Comment</span>
        </button>
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <RepostIcon /><span>Repost</span>
        </button>
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors">
          <SendIcon size={16} /><span>Send</span>
        </button>
      </div>
    </div>
  )
}

function GoogleBusinessMockup({ caption, imagePreviews }: MockupProps) {
  return (
    <div className="bg-white text-gray-900 font-sans select-none">
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100">
        <img src={BUSINESS_LOGO} alt={BUSINESS_NAME} className="w-10 h-10 rounded-lg object-cover shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-[13px] text-gray-800 leading-tight truncate">{BUSINESS_NAME}</p>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="text-yellow-400 leading-none">★★★★★</span>
            <span>4.9</span>
            <span>·</span>
            <span>Roofing Contractor</span>
          </div>
        </div>
      </div>

      <MediaCarousel images={imagePreviews} aspectRatio="4/3" />

      <div className="px-3 pt-2.5 pb-1">
        <p className="text-[10px] font-semibold text-gray-400 tracking-wider mb-1">WHAT'S NEW</p>
        <p className="text-[13px] text-gray-800 leading-snug whitespace-pre-wrap">{caption}</p>
      </div>

      <div className="px-3 pb-3 pt-2">
        <button className="text-[12px] font-semibold text-[#1a73e8] border border-[#1a73e8] rounded px-4 py-1 hover:bg-blue-50 transition-colors">
          Learn more
        </button>
      </div>
    </div>
  )
}

const MOCKUP_MAP: Record<Platform, React.ComponentType<MockupProps>> = {
  instagram: InstagramMockup,
  facebook: FacebookMockup,
  linkedin: LinkedInMockup,
  google_business: GoogleBusinessMockup,
}

export default function PostMockup({ platform, caption, imagePreviews }: PostMockupProps) {
  const Component = MOCKUP_MAP[platform]
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <Component caption={caption} imagePreviews={imagePreviews} />
    </div>
  )
}
