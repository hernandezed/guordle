import React, {useState, useEffect, useCallback} from "react";
import {motion} from "framer-motion";
import {FaTrophy, FaSadTear} from "react-icons/fa";

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;
const VALID_WORDS = ["APPLE", "BRAIN", "CRANE", "DRINK", "EAGLE", "BAABA", "BAABB", "BABAB"];
const TARGET_WORD = "BAABB";

const WordleClone = React.memo((): JSX.Element => {
    const [attempts, setAttempts] = useState<string[]>(() => JSON.parse(localStorage.getItem("attempts") || JSON.stringify(Array(MAX_ATTEMPTS).fill(""))));
    const [currentAttempt, setCurrentAttempt] = useState<number>(() => JSON.parse(localStorage.getItem("currentAttempt") || "0"));
    const [input, setInput] = useState<string>("");
    const [shake, setShake] = useState<boolean>(false);
    const [submittedAttempts, setSubmittedAttempts] = useState<boolean[]>(() => JSON.parse(localStorage.getItem("submittedAttempts") || JSON.stringify(Array(MAX_ATTEMPTS).fill(false))));
    const [hasWon, setHasWon] = useState<boolean>(() => JSON.parse(localStorage.getItem("hasWon") || "false"));
    const [hasLost, setHasLost] = useState<boolean>(() => JSON.parse(localStorage.getItem("hasLost") || "false"));
    const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
    const [usedLetters, setUsedLetters] = useState<{ [key: string]: string }>(() => JSON.parse(localStorage.getItem("usedLetters") || "{}"));
    const [time, setTime] = useState<number>(() => JSON.parse(localStorage.getItem("time") || "0"));

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent): void => {
            if (currentAttempt >= MAX_ATTEMPTS || hasWon || hasLost) return;
            const key = e.key.toUpperCase();
            if (/^[A-Z]$/.test(key) && input.length < WORD_LENGTH) {
                handleLetterClick(key);
            }
            if (e.key === "Backspace") {
                handleBackspace();
            }
            if (e.key === "Enter" && input.length === WORD_LENGTH) {
                handleEnter();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [input, currentAttempt, attempts, submittedAttempts, hasWon, hasLost]);


    useEffect(() => {
        if (hasWon || hasLost) return;
        const timer = setInterval(() => setTime((prevTime) => prevTime + 1), 1000);
        return () => clearInterval(timer);
    }, [hasWon, hasLost]);

    const handleLetterClick = useCallback((letter: string) => {
        if (input.length < WORD_LENGTH) {
            const newInput = (input + letter).slice(0, WORD_LENGTH);
            const newAttempts = [...attempts];
            newAttempts[currentAttempt] = newInput;
            setAttempts(newAttempts);
            setInput(newInput);
        }
    }, [input, attempts, currentAttempt]);

    const handleBackspace = useCallback(() => {
        const newInput = input.slice(0, -1);
        const newAttempts = [...attempts];
        newAttempts[currentAttempt] = newInput;
        setAttempts(newAttempts);
        setInput(newInput);
    }, [input, attempts, currentAttempt]);

    const handleEnter = useCallback(() => {
        if (!VALID_WORDS.includes(input)) {
            setShake(true);
            setTimeout(() => {
                setShake(false);
                setInput("");
                const newAttempts = [...attempts];
                newAttempts[currentAttempt] = "";
                setAttempts(newAttempts);
            }, 600);
            return;
        }


        const targetLetterCounts: { [key: string]: number } = {};
        for (const letter of TARGET_WORD) {
            targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
        }

        const newUsedLetters = {...usedLetters};
        const attemptLetters = input.split("");
        const feedback: string[] = Array(WORD_LENGTH).fill("");

        for (let i = 0; i < WORD_LENGTH; i++) {
            const letter = attemptLetters[i];
            if (TARGET_WORD[i] === letter) {
                feedback[i] = "G";
                targetLetterCounts[letter]--;
            }
        }

        for (let i = 0; i < WORD_LENGTH; i++) {
            const letter = attemptLetters[i];
            if (feedback[i] === "" && TARGET_WORD.includes(letter) && targetLetterCounts[letter] > 0) {
                feedback[i] = "Y";
                targetLetterCounts[letter]--;
            } else if (feedback[i] === "") {
                feedback[i] = "R";
            }
        }

        for (let i = 0; i < WORD_LENGTH; i++) {
            const letter = attemptLetters[i];
            if (feedback[i] === "Y") {
                newUsedLetters[letter] = "present";
            } else if (feedback[i] === "G" && newUsedLetters[letter] !== "present") {
                newUsedLetters[letter] = "correct";
            } else if (!newUsedLetters[letter]) {
                newUsedLetters[letter] = "absent";
            }
        }

        setUsedLetters(newUsedLetters);

        const newSubmittedAttempts = [...submittedAttempts];
        newSubmittedAttempts[currentAttempt] = true;
        setSubmittedAttempts(newSubmittedAttempts);

        if (input === TARGET_WORD) {
            setHasWon(true);
        }

        if (currentAttempt + 1 >= MAX_ATTEMPTS && input !== TARGET_WORD) {
            setHasLost(true);
        }

        setCurrentAttempt(currentAttempt + 1);
        setInput("");


    }, [input, attempts, currentAttempt, usedLetters, submittedAttempts]);

    const getLetterStyle = useCallback((letter: string, index: number, attemptIndex: number): string => {
        if (!submittedAttempts[attemptIndex]) return "border-gray-400";
        const feedback = getFeedbackForAttempt(attempts[attemptIndex]);
        if (feedback[index] === "G") return "bg-green-500 text-white";
        if (feedback[index] === "Y") return "bg-yellow-500 text-white";
        return "bg-gray-400 text-white";
    }, [submittedAttempts, attempts]);

    const getFeedbackForAttempt = useCallback((attempt: string): string[] => {
        const feedback: string[] = Array(WORD_LENGTH).fill("");
        const targetLetterCounts: { [key: string]: number } = {};

        for (const letter of TARGET_WORD) {
            targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
        }

        for (let i = 0; i < WORD_LENGTH; i++) {
            const letter = attempt[i];
            if (TARGET_WORD[i] === letter) {
                feedback[i] = "G";
                targetLetterCounts[letter]--;
            }
        }

        for (let i = 0; i < WORD_LENGTH; i++) {
            const letter = attempt[i];
            if (feedback[i] === "" && TARGET_WORD.includes(letter) && targetLetterCounts[letter] > 0) {
                feedback[i] = "Y";
                targetLetterCounts[letter]--;
            } else if (feedback[i] === "") {
                feedback[i] = "R";
            }
        }

        return feedback;
    }, []);

    const getKeyboardLetterStyle = useCallback((letter: string): string => {
        if (usedLetters[letter] === "present") return "bg-yellow-500 text-white";
        if (usedLetters[letter] === "correct") return "bg-green-500 text-white";
        if (usedLetters[letter] === "absent") return "bg-gray-400 text-white";
        return isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900";
    }, [usedLetters, isDarkMode]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(!isDarkMode);
    }, [isDarkMode]);


    useEffect(() => {
        localStorage.setItem("attempts", JSON.stringify(attempts));
        localStorage.setItem("currentAttempt", JSON.stringify(currentAttempt));
        localStorage.setItem("submittedAttempts", JSON.stringify(submittedAttempts));
        localStorage.setItem("hasWon", JSON.stringify(hasWon));
        localStorage.setItem("hasLost", JSON.stringify(hasLost));
        localStorage.setItem("usedLetters", JSON.stringify(usedLetters));
        localStorage.setItem("time", JSON.stringify(time));
    }, [attempts, currentAttempt, submittedAttempts, hasWon, hasLost, usedLetters, time]);

    useEffect(() => {
        if (hasWon || hasLost) return;
        const timer = setInterval(() => setTime((prevTime) => prevTime + 1), 1000);
        return () => clearInterval(timer);
    }, [hasWon, hasLost]);

    const resetGame = () => {
        setAttempts(Array(MAX_ATTEMPTS).fill(""));
        setCurrentAttempt(0);
        setInput("");
        setShake(false);
        setSubmittedAttempts(Array(MAX_ATTEMPTS).fill(false));
        setHasWon(false);
        setHasLost(false);
        setUsedLetters({});
        setTime(0);
        localStorage.clear();
    };


    return (
        <div
            className={`flex flex-col items-center justify-center min-h-screen w-full p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <button onClick={resetGame} className="p-2 bg-red-500 text-white rounded">Reiniciar Juego</button>
            <button
                onClick={toggleDarkMode}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
                {isDarkMode ? "🌙" : "☀️"}
            </button>
            <h1 className="text-3xl font-bold mb-6">Guordle</h1>
            <div className="text-xl mb-4">Time: {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</div>
            <div className="flex flex-col items-center space-y-2 w-full max-w-md">
                {attempts.map((word, attemptIndex) => (
                    <motion.div
                        key={attemptIndex}
                        className="flex space-x-2"
                        animate={shake && attemptIndex === currentAttempt ? {x: [-5, 5, -5, 5, 0]} : {}}
                        transition={{duration: 0.3}}
                    >
                        {Array.from({length: WORD_LENGTH}).map((_, letterIndex) => (
                            <motion.div
                                key={letterIndex}
                                className={`w-12 h-12 flex items-center justify-center border-2 rounded-lg text-xl font-bold shadow-md ${
                                    getLetterStyle(word[letterIndex] || "", letterIndex, attemptIndex)
                                }`}
                                initial={{rotateX: 0}}
                                animate={{
                                    rotateX:
                                        hasWon && submittedAttempts[attemptIndex] && word === TARGET_WORD ? 360 : 0,
                                }}
                                transition={{duration: 0.6, delay: letterIndex * 0.2}}
                            >
                                {word[letterIndex] || ""}
                            </motion.div>
                        ))}
                    </motion.div>
                ))}
            </div>
            {currentAttempt < MAX_ATTEMPTS && !hasWon && !hasLost && (
                <p className="text-gray-600 dark:text-gray-400 mt-6">Type your guess and press Enter</p>
            )}
            {hasWon && (
                <div className="flex items-center space-x-2 text-green-500 font-bold mt-6">
                    <FaTrophy className="text-2xl"/>
                    <p>¡Felicidades! ¡Has ganado!</p>
                </div>
            )}
            {hasLost && (
                <div className="flex items-center space-x-2 text-red-500 font-bold mt-6">
                    <FaSadTear className="text-2xl"/>
                    <p>
                        ¡Oh no! Has perdido. La palabra correcta era:{" "}
                        <span className="underline">{TARGET_WORD}</span>
                    </p>
                </div>
            )}
            <div className="mt-8 w-full max-w-md">
                <div className="flex justify-center space-x-1 mb-1">
                    {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((letter) => (
                        <button
                            key={letter}
                            className={`w-10 h-12 flex items-center justify-center rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer ${
                                getKeyboardLetterStyle(letter)
                            } ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"}`}
                            onClick={() => handleLetterClick(letter)}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
                <div className="flex justify-center space-x-1 mb-1">
                    {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((letter) => (
                        <button
                            key={letter}
                            className={`w-10 h-12 flex items-center justify-center rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer ${
                                getKeyboardLetterStyle(letter)
                            } ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"}`}
                            onClick={() => handleLetterClick(letter)}
                        >
                            {letter}
                        </button>
                    ))}
                    <button
                        className={`w-14 h-12 flex items-center justify-center rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer ${
                            isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                        onClick={handleBackspace}
                    >
                        ⌫
                    </button>
                </div>
                <div className="flex justify-center space-x-1">
                    {["Z", "X", "C", "V", "B", "N", "M"].map((letter) => (
                        <button
                            key={letter}
                            className={`w-10 h-12 flex items-center justify-center rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer ${
                                getKeyboardLetterStyle(letter)
                            } ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"}`}
                            onClick={() => handleLetterClick(letter)}
                        >
                            {letter}
                        </button>
                    ))}
                    <button
                        className={`w-20 h-12 flex items-center justify-center rounded-lg text-lg font-bold shadow-md transition-colors cursor-pointer ${
                            isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                        onClick={handleEnter}
                    >
                        Enter
                    </button>
                </div>
            </div>
        </div>
    );
});

export default WordleClone;
