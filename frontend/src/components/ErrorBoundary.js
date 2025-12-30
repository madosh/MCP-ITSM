import React from 'react';
import { Alert, Button, Card, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // You could also log the error to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Optionally reload the page
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Container className="mt-5">
          <Card className="shadow-sm">
            <Card.Header className="bg-danger text-white">
              <h4 className="mb-0">Something went wrong</h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="danger">
                <Alert.Heading>Application Error</Alert.Heading>
                <p>
                  The application encountered an unexpected error. Please try refreshing the page.
                  If the problem persists, contact support.
                </p>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-3">
                  <h5>Error Details (Development Mode Only):</h5>
                  <pre className="bg-light p-3 rounded border" style={{ overflow: 'auto' }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                    {'\n\n'}
                    <strong>Stack Trace:</strong>
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="mt-3 d-flex gap-2">
                <Button variant="primary" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="outline-secondary" onClick={() => window.location.href = '/'}>
                  Go to Home
                </Button>
                <Button variant="outline-secondary" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
