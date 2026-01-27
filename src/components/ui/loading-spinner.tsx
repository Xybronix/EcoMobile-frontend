import React from "react";

"use client";


interface LoadingSpinnerProps {
    size?: number | string;
    className?: string;
    ariaLabel?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 24,
    className = "",
    ariaLabel = "Chargement",
}) => {
    const s = typeof size === "number" ? `${size}px` : size;

    return (
        <svg
            role="status"
            aria-label={ariaLabel}
            className={`animate-spin text-gray-600 ${className}`}
            style={{ width: s, height: s }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="4"
            />
            <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
            />
        </svg>
    );
};

export default LoadingSpinner;