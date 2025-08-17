import { useState } from "react";
import './Auth.css';
 function Auth({ onLoginSuccess}) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const API_BASE_URL = "http://localhost:8000";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const endpoint = isRegister ? "/register" : "/token";
        let body;
        let headers = {};
        if (isRegister) {
            body = JSON.stringify({ email, password });
            headers["Content-Type"] = "application/json";
        } else {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);
            body = formData;
            headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        try{
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: headers,
                body: body,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "An error occurred");
            }

            if(isRegister) {
                setMessage("Registration successful! You can now log in.");
                setEmail("");
                setPassword("");
                setIsRegister(false);
            } else {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("token_type", data.token_type);
                setMessage("Login successful!");
                onLoginSuccess();
            }
        }
        catch (error){
            console.error("Error:", error);
            setError(error.message || "An error occurred");
        }};
        return (
        <div className="auth-container">
            <h2>{isRegister ? "Register" : "Login"}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">{isRegister ? "Register" : "Login"}</button>
            </form>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <p>
                {isRegister ? (
                    <>
                    Already have an account?{" "}
                    <button onClick={() => setIsRegister(false)}>Login</button>
                    </>
                ):(
                    <>
                    Don't have an account?{" "}
                    <button onClick={() => setIsRegister(true)}>Register</button>
                    </>
                )}
            </p>
            </div>
        );
    }

export default Auth;
