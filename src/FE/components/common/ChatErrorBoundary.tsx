import { Component, ErrorInfo, ReactNode } from 'react';

import { translate } from '@/hooks/useTranslation';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  resetKey?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

class ChatErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chat view crashed:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  handleRetry = () => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <h2 className="text-lg font-medium">
            {translate('This conversation could not be displayed.')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {translate(
              'Sorry, there was an unexpected error, please try again later.',
            )}
          </p>
          <Button type="button" onClick={this.handleRetry}>
            {translate('Reload conversation')}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
