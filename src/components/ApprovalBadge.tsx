import DynamicIcon from '@stevederico/skateboard-ui/DynamicIcon';

/** Props for the ApprovalBadge component. */
interface ApprovalBadgeProps {
  /** Whether the product passed the ingredient check */
  isApproved: boolean;
  /** Show the text badge below the icon (defaults to true) */
  showBadge?: boolean;
}

/**
 * Visual approval indicator for a scanned product.
 *
 * @component
 * @returns Thumbs-up/down icon with optional Approved/Not Approved badge
 */
export default function ApprovalBadge({ isApproved, showBadge = true }: ApprovalBadgeProps) {
  if (isApproved) {
    return (
      <div className="flex flex-col items-center">
        <DynamicIcon name="ThumbsUp" className="size-24 text-green-500" />
        {showBadge && (
          <div className="bg-green-500 px-3 py-2 text-white rounded-full my-4">Approved</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <DynamicIcon name="ThumbsDown" className="size-24 text-red-500" />
      {showBadge && (
        <div className="bg-red-500 px-3 py-2 text-white rounded-full my-4">Not Approved</div>
      )}
    </div>
  );
}
