import { Footer } from "@/components/layout/footer";

export default function UserLayout({ children }) {
    return (
        <div>
            <div className="px-2 max-w-7xl mx-auto md:px-10">
                {children}
            </div>
    <Footer />
    </div>
    );
}