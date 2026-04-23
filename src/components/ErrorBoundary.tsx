import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home, ShieldAlert, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/Dashboard';
  };

  private getErrorMessage = (errorMsg: string) => {
    const { t } = this.props;
    if (errorMsg.includes('permission-denied') || errorMsg.includes('insufficient permissions')) {
      return t('errors.firebase.permission-denied');
    }
    if (errorMsg.includes('not-found')) return t('errors.firebase.not-found');
    if (errorMsg.includes('already-exists')) return t('errors.firebase.already-exists');
    if (errorMsg.includes('resource-exhausted')) return t('errors.firebase.resource-exhausted');
    if (errorMsg.includes('unavailable')) return t('errors.firebase.unavailable');
    if (errorMsg.includes('unauthenticated')) return t('errors.firebase.unauthenticated');
    return t('errors.firebase.default');
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.toString().toLowerCase() || '';
      const isPermissionError = errorMsg.includes('permission-denied') || errorMsg.includes('insufficient permissions');
      const translatedErrorMsg = this.getErrorMessage(errorMsg);

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <Card className={`max-w-md w-full border-${isPermissionError ? 'orange' : 'red'}-100 shadow-xl`}>
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto w-16 h-16 bg-${isPermissionError ? 'orange' : 'red'}-100 text-${isPermissionError ? 'orange' : 'red'}-600 rounded-full flex items-center justify-center mb-4`}>
                {isPermissionError ? <ShieldAlert className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {isPermissionError ? 'Acesso Negado' : 'Ops! Algo deu errado'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-slate-600">
                {translatedErrorMsg}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left bg-slate-900 text-slate-200 p-4 rounded-lg text-xs font-mono overflow-auto max-h-40">
                  <p className="font-bold text-red-400 mb-1">{this.state.error.toString()}</p>
                  <p className="opacity-70">{this.state.errorInfo?.componentStack}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={this.handleReset} className="bg-blue-600 hover:bg-blue-700 w-full">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                {isPermissionError && (
                  <Button variant="outline" onClick={() => window.open('https://wa.me/5511999999999', '_blank')} className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contatar Suporte (WhatsApp)
                  </Button>
                )}
                <Button variant="ghost" onClick={this.handleGoHome} className="w-full text-slate-500">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar para o Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);
