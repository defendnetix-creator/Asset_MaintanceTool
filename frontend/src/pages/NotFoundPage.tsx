// frontend/src/pages/NotFoundPage.tsx
// 404 Not Found page

import { Link } from 'react-router-dom';
import { Home, Search, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 px-8">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold text-muted-foreground mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => window.history.back()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}