// src/pages/friend-search.js
import FriendSearch from '@/components/FriendSearch';
import RequestHandler from '@/components/RequestHandler';
import Link from "next/link";

const FriendSearchPage = () => {
    return (
        <div className='text-white'>
            <h1>Friend Search</h1>
            <div>
                <FriendSearch />
                <RequestHandler />
            </div>
            <br />
            <Link href='/user-main' className="bg-green-500 text-white p-2 rounded mt-2" >Dashboard</Link>
        </div>
    );
};

export default FriendSearchPage;