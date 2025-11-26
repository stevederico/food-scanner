import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ApprovalBadge({ isApproved, showBadge = true }) {
  if (isApproved) {
    return (
      <div className="flex flex-col items-center">
        <ThumbsUp className="size-24 text-green-500" />
        {showBadge && (
          <div className="bg-green-500 px-3 py-2 text-white rounded-full my-4">Approved</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ThumbsDown className="size-24 text-red-500" />
      {showBadge && (
        <div className="bg-red-500 px-3 py-2 text-white rounded-full my-4">Not Approved</div>
      )}
    </div>
  );
}
