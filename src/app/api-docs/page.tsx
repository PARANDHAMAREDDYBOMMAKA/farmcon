'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">FarmCon API Documentation</h1>
          <p className="text-gray-600">
            Comprehensive API documentation for the FarmCon marketplace platform
          </p>
        </div>
        <SwaggerUI url="/api/docs" />
      </div>
    </div>
  );
}
