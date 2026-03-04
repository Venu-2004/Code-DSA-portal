import React from 'react';
import { Link } from 'react-router-dom';

function ProblemCard({ problem }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY':
        return 'badge-easy';
      case 'MEDIUM':
        return 'badge-medium';
      case 'HARD':
        return 'badge-hard';
      default:
        return 'badge-easy';
    }
  };

  return (
    <div className="card card-hover group h-full flex flex-col">
      <div className="flex justify-between items-start gap-3 mb-4">
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">
          {problem.title}
        </h3>
        <span className={`badge ${getDifficultyColor(problem.difficulty)} whitespace-nowrap`}>
          {problem.difficulty}
        </span>
      </div>

      <p className="text-slate-300 text-sm mb-5 line-clamp-3 flex-grow">
        {problem.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        <span className="badge badge-topic">{problem.topic.replace('_', ' ')}</span>
      </div>

      <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/70 pt-4 mb-5">
        <span>{problem.timeLimit}ms</span>
        <span>{problem.memoryLimit}MB</span>
      </div>

      <Link to={`/problems/${problem.id}`} className="btn-primary w-full text-center block">
        Solve Problem
      </Link>
    </div>
  );
}

export default ProblemCard;
