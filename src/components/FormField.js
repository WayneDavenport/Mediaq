const FormField = ({ label, name, value, onChange, type = 'text', options = [], ...rest }) => {
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