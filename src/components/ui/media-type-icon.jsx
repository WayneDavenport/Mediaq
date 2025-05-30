import { ClipboardCheck } from 'lucide-react';

const MediaTypeIcon = ({ type, className = "" }) => {
    const iconStyle = `w-4 h-4 ${className}`;

    switch (type) {
        case 'movie':
            return (
                <svg className={iconStyle} viewBox="0 0 115.46 122.88">
                    <path fillRule="evenodd" clipRule="evenodd" d="M108.07,15.56L5.7,52.84L0,37.22L102.37,0L108.07,15.56L108.07,15.56z M115.46,122.88H5.87V53.67h109.59 V122.88L115.46,122.88z M101.79,15.65V2.36l-7.23,2.61v13.34L101.79,15.65L101.79,15.65L101.79,15.65z M87.39,20.93V7.59 l-7.26,2.58v13.45L87.39,20.93L87.39,20.93z M72.49,26.07v-13.2l-7.26,2.61v13.26L72.49,26.07L72.49,26.07L72.49,26.07z M113.43,68.32l-4.56-12.54h-7.73l4.56,12.54H113.43L113.43,68.32z M97.64,68.32l-4.56-12.54h-7.76l4.59,12.54H97.64L97.64,68.32z M57.98,31.69V18.32l-7.25,2.61v13.34L57.98,31.69L57.98,31.69z M82.41,68.32l-4.56-12.54h-7.73l4.56,12.54H82.41L82.41,68.32z M43.08,36.8V23.54l-7.34,2.61v13.34L43.08,36.8L43.08,36.8z M66.62,68.32l-4.56-12.54h-7.75l4.56,12.54H66.62L66.62,68.32z M28.82,42.28V28.9l-7.31,2.7v13.26L28.82,42.28L28.82,42.28L28.82,42.28z M51.06,68.32L46.5,55.78h-7.73l4.56,12.54H51.06 L51.06,68.32z M13.84,47.39V34.13l-7.26,2.58v13.37L13.84,47.39L13.84,47.39z M35.36,68.32l-4.64-12.54l-7.67,0l4.48,12.54H35.36 L35.36,68.32z M19.96,68.32l-4.64-12.54l-7.73,0l4.56,12.54H19.96L19.96,68.32z"
                        fill="currentColor" />
                </svg>
            );
        case 'book':
            return (
                <svg className={iconStyle} viewBox="0 0 122.88 90.02">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0 8.62c17.28-10.66 34.96-12.3 53.26 0v79.64c-12.65-9.37-31.03-8.24-53.26 0V8.62zm59.09.2h5.28c1.08 0 1.96.88 1.96 1.95v77.29c0 1.08-.88 1.96-1.96 1.96h-5.28a1.97 1.97 0 01-1.96-1.96V10.77c.01-1.07.89-1.95 1.96-1.95zm63.79-.2c-17.28-10.66-34.97-12.3-53.27 0v79.64c12.65-9.37 31.03-8.24 53.27 0V8.62z"
                        fill="currentColor" />
                </svg>
            );
        case 'game':
            return (
                <svg className={iconStyle} viewBox="0 0 122.88 79.92">
                    <path fillRule="evenodd" clipRule="evenodd" d="M23.35,72.21c4.04-4.11,8.82-8.28,12.37-13.68h51.43c3.56,5.39,8.34,9.57,12.37,13.68 c30.95,31.52,28.87-42.32,7-64.5h-1.68C102.09,3.11,96.72,0,90.55,0c-6.17,0-11.53,3.11-14.28,7.71H46.61 C43.86,3.11,38.49,0,32.32,0c-6.17,0-11.53,3.11-14.29,7.71h-1.68C-5.52,29.89-7.6,103.72,23.35,72.21L23.35,72.21z M29.85,12.84 h11.11v8.85l8.85,0V32.8h-8.85v8.85H29.85V32.8H21V21.69h8.85L29.85,12.84L29.85,12.84L29.85,12.84z M83.16,36.9 c2.69,0,4.87,2.18,4.87,4.87c0,2.69-2.18,4.88-4.87,4.88s-4.87-2.18-4.87-4.88C78.29,39.08,80.47,36.9,83.16,36.9L83.16,36.9z M85.82,15.21c3.9,0,7.06,3.16,7.06,7.05c0,3.9-3.16,7.05-7.06,7.05c-3.9,0-7.05-3.16-7.05-7.05 C78.77,18.37,81.92,15.21,85.82,15.21L85.82,15.21z M104.04,26.11c2.69,0,4.87,2.18,4.87,4.87c0,2.69-2.18,4.87-4.87,4.87 c-2.69,0-4.88-2.18-4.88-4.87C99.16,28.29,101.35,26.11,104.04,26.11L104.04,26.11z"
                        fill="currentColor" />
                </svg>
            );
        case 'tv':
            return (
                <svg className={iconStyle} viewBox="0 0 123.38 122.69">
                    <path fillRule="evenodd" clipRule="evenodd" d="M0.8,45.21c0.22-0.98,0.46-1.95,0.71-2.91c2.39-9.01,6.16-16.81,11.52-23.23c-0.55-1.67-0.16-3.58,1.16-4.9 c1.32-1.32,3.21-1.71,4.87-1.17c6.81-5.75,15.45-9.89,26.16-12.22c1.38-0.3,2.69-1.05,3.62,0l73.68,83.09 c0.93,1.05,0.69,2.39,0,3.62c-8.57,15.29-20.17,26.53-34.34,34.34c-1.23,0.68-2.56,0.92-3.62,0L0.8,48.83 C-0.26,47.91,0.49,46.59,0.8,45.21L0.8,45.21z"
                        fill="currentColor" />
                </svg>
            );
        case 'task':
            return <ClipboardCheck className={iconStyle} />;
        default:
            return null;
    }
};

export default MediaTypeIcon; 