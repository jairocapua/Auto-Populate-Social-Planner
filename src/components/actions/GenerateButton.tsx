import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

interface GenerateButtonProps {
  onClick: () => void
  disabled: boolean
  isGenerating: boolean
}

export default function GenerateButton({ onClick, disabled, isGenerating }: GenerateButtonProps) {
  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Spinner size="sm" />
          Generating Captions...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2l2.5 5.5L18 10l-5.5 2.5L10 18l-2.5-5.5L2 10l5.5-2.5L10 2z" strokeLinejoin="round" />
          </svg>
          Generate Captions with AI
        </>
      )}
    </Button>
  )
}
