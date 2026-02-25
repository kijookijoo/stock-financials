import { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

export function CustomCursor() {
    const cursorRef = useRef(null);
    const frameRef = useRef(null);
    const targetRef = useRef({ x: 0, y: 0 });
    const currentRef = useRef({ x: 0, y: 0 });
    const visibleRef = useRef(false);
    const activeRef = useRef(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isFinePointer, setIsFinePointer] = useState(false);

    useEffect(() => {
        const pointerQuery = window.matchMedia('(pointer: fine)');
        const updatePointerType = () => setIsFinePointer(pointerQuery.matches);

        updatePointerType();
        pointerQuery.addEventListener('change', updatePointerType);

        return () => pointerQuery.removeEventListener('change', updatePointerType);
    }, []);

    useEffect(() => {
        if (!isFinePointer || !cursorRef.current) return undefined;

        const onMouseMove = (event) => {
            targetRef.current.x = event.clientX;
            targetRef.current.y = event.clientY;

            if (!visibleRef.current) {
                currentRef.current.x = event.clientX;
                currentRef.current.y = event.clientY;
                visibleRef.current = true;
                setIsVisible(true);
            }
        };

        const onMouseDown = () => {
            activeRef.current = true;
            setIsActive(true);
        };

        const onMouseUp = () => {
            activeRef.current = false;
            setIsActive(false);
        };

        const onMouseEnter = () => {
            visibleRef.current = true;
            setIsVisible(true);
        };

        const onMouseLeave = () => {
            visibleRef.current = false;
            setIsVisible(false);
        };

        const animate = () => {
            currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.24;
            currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.24;

            cursorRef.current.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0) translate(-50%, -50%) scale(${activeRef.current ? 0.9 : 1})`;
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mouseenter', onMouseEnter);
        document.addEventListener('mouseleave', onMouseLeave);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mouseenter', onMouseEnter);
            document.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [isFinePointer]);

    if (!isFinePointer) return null;

    return (
        <div
            ref={cursorRef}
            className={`custom-cursor ${isVisible ? 'is-visible' : ''} ${isActive ? 'is-active' : ''}`}
            aria-hidden="true"
        />
    );
}

export default CustomCursor;
