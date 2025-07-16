# Forms Components

This directory contains form-related components for the pitch generator application.

## IdeaValidationFeedback

A comprehensive validation feedback component that provides real-time validation for pitch ideas.

### Features

- **Character Counter**: Visual progress bar with intelligent color coding
- **Quality Score**: 0-100 score with visual indicator and labels
- **Error Display**: Clear error messages for validation failures
- **Warnings**: Optimization suggestions for valid but improvable ideas
- **Suggestions**: Contextual improvement suggestions with examples and priorities
- **Accessibility**: Proper ARIA labels and semantic HTML structure

### Usage

```tsx
import { IdeaValidationFeedback } from '@/components/forms/idea-validation-feedback'
import { validateIdea } from '@/lib/validation/idea-validator'

function MyComponent() {
  const [idea, setIdea] = useState('')
  const validationResult = validateIdea(idea)

  return (
    <IdeaValidationFeedback
      validationResult={validationResult}
      currentLength={idea.length}
      maxLength={500}
      minLength={10}
    />
  )
}
```

### Props

- `validationResult`: ValidationResult object from the validation system
- `currentLength`: Current character count of the input
- `maxLength`: Maximum allowed characters
- `minLength`: Minimum required characters
- `className?`: Optional CSS classes

## EnhancedIdeaForm

An enhanced version of the idea form that integrates validation feedback.

### Features

- **Real-time Validation**: Automatic validation as user types
- **Integrated Feedback**: Built-in IdeaValidationFeedback component
- **Accessibility**: Proper ARIA attributes and labels
- **Customizable**: Optional validation feedback display

### Usage

```tsx
import { EnhancedIdeaForm } from '@/components/forms/enhanced-idea-form'

function MyComponent() {
  const [idea, setIdea] = useState('')

  return (
    <EnhancedIdeaForm
      value={idea}
      onChange={setIdea}
      showValidationFeedback={true}
    />
  )
}
```

### Props

- `value`: Current idea text
- `onChange`: Callback when text changes
- `placeholder?`: Custom placeholder text
- `showValidationFeedback?`: Whether to show validation feedback (default: true)
- `className?`: Optional CSS classes

## ErrorDisplay

An enhanced error display component that provides differentiated error handling based on error type.

### Features

- **Error Type Classification**: Different styling and icons for each error type
- **Contextual Actions**: Retry, help, and support buttons based on error type
- **Cooldown Management**: Visual countdown timer for retry attempts
- **Help Integration**: Direct links to contextual help documentation
- **Support Integration**: Email support with pre-filled error details
- **Development Mode**: Technical error details in development environment

### Usage

```tsx
import { ErrorDisplay } from '@/components/forms/error-display'
import { EnhancedError, ErrorType } from '@/types/enhanced-errors'

function MyComponent() {
  const [error, setError] = useState<EnhancedError | null>(null)

  const handleRetry = () => {
    // Retry logic
  }

  const handleDismiss = () => {
    setError(null)
  }

  return error ? (
    <ErrorDisplay
      error={error}
      onRetry={handleRetry}
      onDismiss={handleDismiss}
      retryDisabled={false}
      cooldownSeconds={5}
    />
  ) : null
}
```

### Props

- `error`: EnhancedError object with error details
- `onRetry?`: Callback for retry action
- `onDismiss?`: Callback for dismiss action
- `retryDisabled?`: Whether retry button should be disabled
- `cooldownSeconds?`: Seconds to wait before allowing retry

### Error Types Supported

- **NETWORK**: Connection issues with retry functionality
- **VALIDATION**: Input validation errors (no retry)
- **TIMEOUT**: Request timeout with retry and optimization suggestions
- **SERVER**: Server errors with retry and support options
- **AI_SERVICE**: AI service unavailable with retry and support
- **UNKNOWN**: Fallback for unclassified errors

## ErrorDisplayDemo

A comprehensive demo component showing all ErrorDisplay functionality.

### Usage

```tsx
import { ErrorDisplayDemo } from '@/components/forms/error-display-demo'

function DemoPage() {
  return <ErrorDisplayDemo />
}
```

## IdeaValidationFeedbackDemo

A demo component showing how to use the validation feedback system.

### Usage

```tsx
import { IdeaValidationFeedbackDemo } from '@/components/forms/idea-validation-feedback-demo'

function DemoPage() {
  return <IdeaValidationFeedbackDemo />
}
```

## Testing

All components include comprehensive tests covering:

- Rendering and display logic
- User interactions
- Validation states
- Accessibility features
- Edge cases

Run tests with:

```bash
npm test -- --testPathPatterns="forms.*test"
```

## Implementation Notes

### Task 7 Requirements Fulfilled

✅ **Real-time validation error display**: Errors are shown immediately with clear messages and icons
✅ **Intelligent character counter**: Visual progress bar with color coding and status messages  
✅ **Improvement suggestions with examples**: Contextual suggestions with examples and priority levels
✅ **Quality score visual indicators**: Score display with progress bar, color coding, and quality labels

### Task 8 Requirements Fulfilled

✅ **Differentiated display based on error type**: Each error type has unique styling, icons, and colors
✅ **Contextual action buttons**: Retry, help, and support buttons shown based on error type and context
✅ **Cooldown display for retry attempts**: Visual countdown timer prevents spam and shows remaining time
✅ **Contextual help links**: Direct links to relevant help documentation based on error type

### Component Features

#### Character Counter
- Shows current/max character count
- Visual progress bar with color coding
- Status indicators: empty, too-short, good, near-limit, over-limit
- Specific feedback messages (e.g., "5 caractères manquants")

#### Quality Score Display
- 0-100 score with visual progress bar
- Color-coded based on score ranges:
  - 80-100: Green (Excellente)
  - 60-79: Yellow (Bonne) 
  - 40-59: Orange (Correcte)
  - 0-39: Red (À améliorer)
- Only shown for valid ideas with content

#### Validation Errors
- Red-themed error display with X-circle icon
- Clear, actionable error messages
- Multiple errors displayed in list format

#### Warnings & Suggestions
- Yellow-themed warnings for optimization tips
- Blue-themed suggestions with lightbulb icon
- Priority indicators (high/medium/low) with colored dots
- Examples provided where applicable
- Limited to top 5 suggestions for clarity

#### Success State
- Green-themed success message for high-quality ideas (score ≥ 80)
- Encourages user when idea is ready for pitch generation

### Integration with Existing System

The components are designed to integrate seamlessly with the existing validation system:

- Uses existing `ValidationResult`, `ValidationError`, `ValidationWarning`, and `IdeaSuggestion` types
- Integrates with `validateIdea()` function from the validation library
- Follows existing component patterns and styling conventions
- Maintains accessibility standards

### Performance Considerations

- Uses `useMemo` for validation to prevent unnecessary recalculations
- Debounced validation can be added at the parent component level if needed
- Minimal re-renders through proper prop structure