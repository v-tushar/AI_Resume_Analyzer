import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Chatbot from "~/components/Chatbot";

export const meta = () => ([
    { title: 'Resumind | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const imageUrlsRef = useRef<string[]>([]);
    const resumeUrlRef = useRef<string>('');

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading, auth.isAuthenticated, id, navigate])

    useEffect(() => {
        const loadResume = async () => {
            try {
                const resume = await kv.get(`resume:${id}`);

                if (!resume) {
                    setError("Resume not found. It might have been deleted.");
                    return;
                }

                const data = JSON.parse(resume);

                if (!data.feedback) {
                    // Still analyzing or failed analysis
                    console.log("Feedback missing in resume data");
                }

                const resumeBlob = await fs.read(data.resumePath);
                if (!resumeBlob) {
                    setError("Failed to load PDF file.");
                    return;
                }

                const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
                const newResumeUrl = URL.createObjectURL(pdfBlob);
                resumeUrlRef.current = newResumeUrl;
                setResumeUrl(newResumeUrl);

                const paths = data.imagePaths || (data.imagePath ? [data.imagePath] : []);
                const urls: string[] = [];

                for (const path of paths) {
                    const imageBlob = await fs.read(path);
                    if (imageBlob) {
                        urls.push(URL.createObjectURL(imageBlob));
                    }
                }

                if (urls.length === 0) {
                    setError("Failed to load resume images.");
                    return;
                }
                imageUrlsRef.current = urls;
                setImageUrls(urls);

                setFeedback(data.feedback);
                setJobTitle(data.jobTitle || '');
                setJobDescription(data.jobDescription || '');
            } catch (error) {
                console.error("Failed to load resume:", error);
                setError("An error occurred while loading the resume details.");
            }
        }

        loadResume();

        return () => {
            if (resumeUrlRef.current) URL.revokeObjectURL(resumeUrlRef.current);
            imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, [id, fs, kv]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="Back" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center overflow-y-auto pt-10">
                    {imageUrls.length > 0 && resumeUrl && (
                        <div className="flex flex-col gap-4 items-center w-full">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-fit w-fit">
                                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={url}
                                            className="w-full h-auto object-contain rounded-2xl"
                                            alt={`Resume Page ${index + 1}`}
                                        />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <p className="text-xl text-red-500 font-semibold">{error}</p>
                            <Link to="/" className="primary-button">Back to Homepage</Link>
                        </div>
                    ) : feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.overallScore} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                            <Chatbot
                                feedback={feedback}
                                jobTitle={jobTitle}
                                jobDescription={jobDescription}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-gray-500 italic">Analyzing your resume... please wait.</p>
                            <img src="/images/resume-scan-2.gif" className="w-full" />
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume
