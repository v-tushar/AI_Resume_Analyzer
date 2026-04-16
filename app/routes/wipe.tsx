import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import Navbar from "~/components/Navbar";

export const meta = () => ([
    { title: 'Resumind | Settings' },
    { name: 'description', content: 'Manage your resume data' },
])

const WipeApp = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);
    const [isWiping, setIsWiping] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [wiped, setWiped] = useState(false);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        if (!isLoading && auth.isAuthenticated) {
            loadFiles();
        }
    }, [isLoading, auth.isAuthenticated]);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading, auth.isAuthenticated, navigate]);

    const handleDelete = async () => {
        if (confirmText !== "DELETE") return;
        if (!confirm("This will permanently delete ALL your resume data. This action cannot be undone. Are you sure?")) {
            return;
        }

        setIsWiping(true);
        try {
            await Promise.all(files.map((file) => fs.delete(file.path)));
            await kv.flush();
            setFiles([]);
            setWiped(true);
            setConfirmText('');
        } catch (error) {
            console.error("Failed to wipe data:", error);
        } finally {
            setIsWiping(false);
        }
    };

    if (isLoading) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover">
                <Navbar />
                <section className="main-section">
                    <div className="page-heading py-16">
                        <h2>Loading...</h2>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16 max-w-lg mx-auto">
                    <h1>Data Management</h1>
                    <p className="text-gray-500 text-sm mt-2">Signed in as <strong>{auth.user?.username}</strong></p>

                    {wiped ? (
                        <div className="mt-8 text-center">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                <p className="text-green-700 font-semibold">All data has been wiped successfully.</p>
                                <Link to="/" className="primary-button mt-4 inline-block">
                                    Go Home
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mt-8 gradient-border">
                                <h3 className="font-semibold text-sm mb-2">Stored Files ({files.length})</h3>
                                {files.length === 0 ? (
                                    <p className="text-gray-400 text-xs">No files found.</p>
                                ) : (
                                    <ul className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                                        {files.map((file) => (
                                            <li key={file.id} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                                {file.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
                                <h3 className="font-semibold text-red-800 text-sm">Danger Zone</h3>
                                <p className="text-red-600 text-xs mt-1 mb-4">
                                    This will permanently delete all your uploaded resumes, images, and analysis data.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <label className="text-xs text-red-700" htmlFor="confirm-delete">
                                        Type <strong>DELETE</strong> to confirm:
                                    </label>
                                    <input
                                        id="confirm-delete"
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                                        maxLength={10}
                                        aria-label="Type DELETE to confirm data wipe"
                                    />
                                    <button
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        onClick={handleDelete}
                                        disabled={confirmText !== "DELETE" || isWiping || files.length === 0}
                                        aria-label="Wipe all data"
                                    >
                                        {isWiping ? 'Wiping...' : 'Wipe All Data'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

export default WipeApp;
