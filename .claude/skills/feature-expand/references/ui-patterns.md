# UI 패턴 레퍼런스

## 색상 시스템

```
배경: bg-[#0a0c10] (최외곽), bg-[#111318] (카드)
텍스트: text-white (강조), text-slate-400 (보조), text-slate-600 (약한)
상승: text-emerald-400, bg-emerald-500/10
하락: text-red-400, bg-red-500/10
테두리: border-white/[0.06] → hover: border-white/[0.12]
```

## 카드 컴포넌트 패턴

```tsx
<div className="bg-[#111318] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 transition-all">
```

## 로딩 스켈레톤

```tsx
{data ? (
  <span>{value}</span>
) : (
  <span className="text-slate-600">—</span>
)}
```

## 배지 (등락률)

```tsx
<span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${bgClass} ${colorClass}`}>
  {isUp ? '+' : ''}{changePercent.toFixed(2)}%
</span>
```

## 모달 패턴

```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md mx-4">
      {/* 내용 */}
    </div>
  </div>
)}
```
