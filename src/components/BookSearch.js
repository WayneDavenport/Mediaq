// src/components/BookSearch.js
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchResults, setStagingItem } from '@/store/slices/searchSlice';
import { useSession } from 'next-auth/react';

const BookSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        author: '',
    });
    const [results, setResults] = useState([]);
    const dispatch = useDispatch();
    const { data: session } = useSession();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/googleBooks?query=${searchParams.query}&author=${searchParams.author}`);
            const data = await response.json();
            setResults(data.books);
            dispatch(setSearchResults(data.books));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAdd = (item) => {
        const readingSpeed = session?.user?.readingSpeed || 20; // Default to 20 if not provided
        const duration = Math.ceil(item.pageCount / readingSpeed * 30); // Calculate duration in minutes
        const additionalFields = {
            authors: item.authors?.join(', '),
            publisher: item.publisher,
            pageCount: parseInt(item.pageCount),
            isbn: item.isbn
        };

        const formData = {
            title: item.title,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: 'Book',
            description: item.description,
            additionalFields: additionalFields,
        };

        dispatch(setStagingItem(formData));
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Search Books</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    name="query"
                    placeholder="Title"
                    value={searchParams.query}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full text-white-700 bg-[#222227]"
                />
                <input
                    type="text"
                    name="author"
                    placeholder="Author"
                    value={searchParams.author}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full text-white-700 bg-[#222227]"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Search</button>
            </form>
            <div className="space-y-4">
                {results.map((result, index) => (
                    <div key={index} className="border p-4 rounded shadow">
                        <h3 className="text-xl font-semibold">{result.title}</h3>
                        <p className="text-gray-700">{result.description}</p>
                        <p className="text-gray-500">Authors: {result.authors?.join(', ')}</p>
                        <p className="text-gray-500">Publisher: {result.publisher}</p>
                        <p className="text-gray-500">Page Count: {parseInt(result.pageCount)}</p>
                        <button onClick={() => handleAdd(result)} className="bg-green-500 text-white p-2 rounded mt-2">Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookSearch;