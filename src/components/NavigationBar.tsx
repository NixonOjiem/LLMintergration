import React from 'react'

function NavigationBar() {
    return (
        <header className="header">
            <a href="#" className="companyName">
                LLM Intergration
            </a>
            <img src="/logo.png" alt="Logo" className="logoIcon" />
            <nav className="navbar">
                <a href="#">Portfolio</a>
                <a href="#">About me</a>
                <a href="#">Services</a>
                <a href="#">Recent Projects</a>
            </nav>
        </header>
    )
}

export default NavigationBar