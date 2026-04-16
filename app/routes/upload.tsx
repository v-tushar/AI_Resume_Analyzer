import { type FormEvent, useEffect, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImages } from "~/lib/pdf2img";
import { generateUUID, cleanJson, validateFeedbackScores } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

export const meta = () => ([
    { title: 'Resumind | Upload' },
    { name: 'description', content: 'Upload your resume for AI-powered ATS analysis and feedback' },
])

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/upload`);
    }, [isLoading, auth.isAuthenticated, navigate])

    const handleFileSelect = (file: File | null) => {
        setStatusText('');
        if (file && file.type !== 'application/pdf') {
            setStatusText('Error: Please upload a PDF file');
            setFile(null);
            return;
        }
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        if (file.type !== 'application/pdf') {
            setStatusText('Error: Please upload a PDF file');
            return;
        }
        setIsProcessing(true);

        try {
            setStatusText('Uploading the file...');
            const uploadedFile = await fs.upload([file]);
            if (!uploadedFile || !uploadedFile.path) {
                setStatusText('Error: Failed to upload file');
                setIsProcessing(false);
                return;
            }

            setStatusText('Converting to images...');
            const conversionResult = await convertPdfToImages(file);
            if (conversionResult.images.length === 0) {
                setStatusText(`Error: ${conversionResult.error || 'Failed to convert PDF to images'}`);
                setIsProcessing(false);
                return;
            }

            setStatusText(`Uploading ${conversionResult.images.length} page(s)...`);
            const imagePaths: string[] = [];
            for (const image of conversionResult.images) {
                const uploadedImage = await fs.upload([image.file]);
                if (!uploadedImage || !uploadedImage.path) {
                    setStatusText('Error: Failed to upload one of the images');
                    setIsProcessing(false);
                    return;
                }
                imagePaths.push(uploadedImage.path);
            }

            setStatusText('Preparing data...');
            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePaths: imagePaths,
                companyName, jobTitle, jobDescription,
                feedback: null as Feedback | null,
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            setStatusText('Analyzing resume (this may take a moment)...');

            const feedback = await ai.feedback(
                imagePaths,
                prepareInstructions({ jobTitle, jobDescription })
            )

            if (!feedback) {
                setStatusText('Error: Failed to analyze resume');
                setIsProcessing(false);
                return;
            }

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : Array.isArray(feedback.message.content)
                    ? (typeof feedback.message.content[0] === 'string'
                        ? feedback.message.content[0]
                        : feedback.message.content[0].text || JSON.stringify(feedback.message.content[0]))
                    : JSON.stringify(feedback.message.content);

            try {
                const parsed = JSON.parse(cleanJson(feedbackText));
                data.feedback = validateFeedbackScores(parsed);
            } catch (e) {
                console.error("Failed to parse AI response as JSON:", feedbackText);
                setStatusText('Error: AI response was not in the expected format. Please try again.');
                setIsProcessing(false);
                return;
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));
            setStatusText('Analysis complete, redirecting...');
            navigate(`/resume/${uuid}`);
        } catch (error) {
            console.error("Error during analysis:", error);
            setStatusText(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = (formData.get('company-name') as string || '').trim();
        const jobTitle = (formData.get('job-title') as string || '').trim();
        const jobDescription = (formData.get('job-description') as string || '').trim();

        if (!file || !jobTitle || !jobDescription) {
            setStatusText('Error: Please provide all required fields (Job Title, Job Description, and Resume)');
            return;
        }

        if (jobDescription.length < 50) {
            setStatusText('Error: Job Description is too short. Please provide at least 50 characters for accurate analysis.');
            return;
        }

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" alt="Analyzing your resume" />
                        </>
                    ) : (
                        <>
                            <h2>Drop your resume for an ATS score and improvement tips</h2>
                            {statusText && (
                                <p className="text-badge-red-text bg-badge-red border border-red-200 px-4 py-2 rounded-lg mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {statusText}
                                </p>
                            )}
                        </>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} onChange={() => setStatusText('')} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" maxLength={100} />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" required maxLength={150} />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description (at least 50 characters)" id="job-description" required minLength={50} maxLength={5000} />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className="primary-button" type="submit" disabled={isProcessing} aria-label="Analyze resume">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
