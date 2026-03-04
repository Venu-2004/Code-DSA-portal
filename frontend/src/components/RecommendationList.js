import React from 'react';
import { Link } from 'react-router-dom';
import ProblemCard from './ProblemCard';

function RecommendationList({ recommendations, title = "AI Recommendations" }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-50 mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-slate-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-slate-300">No recommendations available at the moment.</p>
          <p className="text-sm text-slate-400 mt-1">Complete some problems to get personalized recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
        <div className="flex items-center text-sm text-cyan-300">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Powered by AI
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          to="/problems"
          className="btn-primary px-6 py-3"
        >
          View All Problems
          <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default RecommendationList;
