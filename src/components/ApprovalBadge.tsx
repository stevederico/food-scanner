import { ThumbsDown, ThumbsUp } from '../icons';

interface ApprovalBadgeProps {
  
  isApproved: boolean;
  
  showBadge?: boolean;
}

export default function ApprovalBadge({ isApproved, showBadge = true }: ApprovalBadgeProps) {
  if (isApproved) {
    return (
      <div className="flex flex-col items-center">
        <ThumbsUp className="size-24 text-success" />
        {showBadge && (
          <div className="bg-success px-3 py-2 text-app-foreground rounded-full my-4">Approved</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ThumbsDown className="size-24 text-danger" />
      {showBadge && (
        <div className="bg-danger px-3 py-2 text-app-foreground rounded-full my-4">Not Approved</div>
      )}
    </div>
  );
}
