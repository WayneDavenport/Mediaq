// src/components/FormField.js
import { useState } from 'react';

const FormField = ({ label, name, value, onChange, type = 'text', options = [], ...rest }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    if (type === 'select') {
        return (
            <div>
                <label className="block text-gray-700">{label}:</label>
                <select name={name} value={value} onChange={onChange} className="border p-2 w-full rounded text-white-700 bg-[#222227]" {...rest}>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    if (type === 'textarea') {
        return (
            <div>
                <label className="block text-gray-700">{label}:</label>
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`border p-2 w-full rounded text-white-700 bg-[#222227] bg-opacity-20 ${isExpanded ? 'h-auto' : 'h-20 overflow-hidden'}`}
                    {...rest}
                />
                {value.length > 100 && (
                    <button type="button" onClick={toggleExpand} className="text-blue-500 mt-2">
                        {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div>
            <label className="block text-gray-700">{label}:</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="border p-2 w-full rounded text-white-700 bg-[#222227] bg-opacity-20"
                {...rest}
            />
        </div>
    );
};

export default FormField;