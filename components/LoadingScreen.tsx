import React from 'react';

interface LoadingScreenProps {
    phase: 'submitting' | 'matching' | 'formatting' | string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ phase }) => {
    const getLoadingMessage = (): string => {
        switch (phase) {
            case 'submitting':
                return 'Submitting your information...';
            case 'matching':
                return 'Finding the best matches for your items...';
            case 'formatting':
                return 'Preparing your results...';
            default:
                return 'Processing your request...';
        }
    };

    const getLoadingProgress = (): number => {
        switch (phase) {
            case 'submitting':
                return 25;
            case 'matching':
                return 60;
            case 'formatting':
                return 85;
            default:
                return 50;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center">
                    <div className="mb-6">
                        <svg
                            className="animate-spin h-12 w-12 text-blue-500 mx-auto"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {getLoadingMessage()}
                    </h3>

                    <p className="text-gray-600 mb-6">
                        This may take a moment as we analyze your items.
                    </p>

                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${getLoadingProgress()}%` }}
                        ></div>
                    </div>

                    <div className="mt-8 text-sm text-gray-500">
                        <div className="flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 text-blue-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Our AI is searching thousands of listings to find the perfect match
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
