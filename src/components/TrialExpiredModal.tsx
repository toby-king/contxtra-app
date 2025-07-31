import React from 'react';

interface TrialExpiredModalProps {
  onSignUp: () => void;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ onSignUp }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] p-6 max-w-md w-full relative animate-fade-in">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Thank You for Using CONTXTRA!</h2>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Your Trial Period Has Ended</h2>
          <p className="text-slate-600 mb-6">
            You've reached the limit of your free trial. Sign up now to continue adding context to posts and unlock all features!
          </p>
          
          <button
            onClick={onSignUp}
            className="w-full py-2 px-4 bg-[#fbd050] hover:bg-[#f8c83e] text-slate-800 rounded-[24px] font-medium transition-colors duration-200"
          >
            Sign Up Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;