import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export const BookCatalog: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await api.get('/library/books');
      setBooks(res.data.data.books);
    } catch (error) {
      console.error('Failed to fetch books', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Catalog</h1>
          <p className="text-gray-500 mt-1">Browse all books in the library</p>
        </div>
        {(user?.role === 'LIBRARIAN' || user?.role === 'SUPER_ADMIN') && (
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            + Add Book
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map(book => (
          <div key={book._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">No Cover</span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 line-clamp-1" title={book.title}>{book.title}</h3>
            <p className="text-sm text-gray-500 mt-1">By {book.authors.join(', ')}</p>
            <div className="mt-auto pt-4 flex justify-between items-center text-sm">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">Code: {book.bookCode}</span>
              <button className="text-indigo-600 hover:text-indigo-800 font-medium">Reserve</button>
            </div>
          </div>
        ))}
        {books.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No books found in the catalog.
          </div>
        )}
      </div>
    </div>
  );
};
