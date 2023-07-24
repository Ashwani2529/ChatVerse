import React, { useState } from "react";
import "./Join.css";
import logo from "../../images/logo.png";
import { Link } from "react-router-dom";

let user;

const sendUser = () => {
    user = document.getElementById("joinInput").value;
    document.getElementById("joinInput").value = "";
};

const Join = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() !== "") {
            sendUser();
        }
    };

    const [name, setname] = useState("");

    return (
        <div className="JoinPage">
            <form className="JoinContainer" onSubmit={handleSubmit}>
                <img src={logo} alt="logo" />
                <h1>ChatVerse</h1>

                <input
                    value={name}
                    onChange={(e) => setname(e.target.value)}
                    placeholder="Enter Your Name"
                    type="text"
                    id="joinInput"
                />
                <Link
                    onClick={(event) => (!name ? event.preventDefault() : null)}
                    to="/chat"
                >
                    {" "}
                    <button type="submit" onClick={sendUser} className="joinbtn">
                        Login
                    </button>
                </Link>
            </form>
        </div>
    );
};

export default Join;
export { user };
