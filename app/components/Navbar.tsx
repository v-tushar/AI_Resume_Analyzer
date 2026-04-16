import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const Navbar = () => {
    const { auth } = usePuterStore();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await auth.signOut();
        navigate("/auth");
    };

    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <div className="flex gap-6 items-center">
                <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                </Link>
                {auth.isAuthenticated && (
                    <button
                        onClick={handleSignOut}
                        className="text-dark-200 hover:text-black font-semibold cursor-pointer"
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </nav>
    )
}
export default Navbar
