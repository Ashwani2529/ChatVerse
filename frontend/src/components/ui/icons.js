import React from 'react';

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

export const SendIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4.5 12 20 4.5 12.8 20l-2-6.4-6.3-1.6Z" />
  </svg>
);

export const LogoutIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 8l-4 4 4 4" />
    <path d="M6 12h9" />
  </svg>
);

export const LockIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export const EyeIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const EyeOffIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 4l16 16" />
    <path d="M9.6 6.2A9.6 9.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.9 3.6" />
    <path d="M6.4 8.1A16.8 16.8 0 0 0 2.5 12S6 18.2 12 18.2c1 0 1.9-.2 2.7-.5" />
    <path d="M10.2 10.3a2.8 2.8 0 0 0 3.7 3.8" />
  </svg>
);

export const UsersIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6" />
    <path d="M17.5 14.4a5.5 5.5 0 0 1 3 5.1" />
  </svg>
);

export const HashIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M9.5 3.5 7.5 20.5M16.5 3.5l-2 17M4 8.5h16M3 15.5h16" />
  </svg>
);

export const AlertIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16.2v.3" />
  </svg>
);

export const RetryIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M20 11.5a8 8 0 1 1-2.6-5.4" />
    <path d="M20 4v4.5h-4.5" />
  </svg>
);
