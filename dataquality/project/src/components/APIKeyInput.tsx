import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

interface APIKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
  isLoading: boolean;
}

export const APIKeyInput: React.FC<APIKeyInputProps> = ({ onApiKeySubmit, isLoading }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div className="text-center mb-6">
          <Key className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-800">Gemini AI API Key</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enter your Google Gemini API key to enable AI-powered insights
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!apiKey.trim() || isLoading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? 'Initializing...' : 'Initialize AI Analysis'}
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Get your API key from{' '}
          <a 
            href="https://makersuite.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>
    </div>
  );
};