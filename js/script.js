// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializeNavigation();
    initializeNameModal();
    initializeContactForm();
    initializeScrollEffects();
});

// Navigation functionality
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active navigation link on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    });
}

// Name personalization modal
function initializeNameModal() {
    const modal = document.getElementById('nameModal');
    const submitBtn = document.getElementById('submitName');
    const skipBtn = document.getElementById('skipName');
    const nameInput = document.getElementById('visitorName');
    const welcomeMessage = document.getElementById('welcome-message');

    // Check if user has already provided their name
    const savedName = localStorage.getItem('visitorName');
    if (savedName) {
        updateWelcomeMessage(savedName);
    } else {
        // Show modal after a short delay
        setTimeout(() => {
            modal.style.display = 'block';
            nameInput.focus();
        }, 2000);
    }

    // Submit name
    submitBtn.addEventListener('click', function() {
        const name = nameInput.value.trim();
        if (name) {
            // Save to localStorage
            localStorage.setItem('visitorName', name);
            updateWelcomeMessage(name);
            modal.style.display = 'none';
            
            // Save to database
            fetch('/api/visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            }).catch(error => {
                console.log('Visitor data could not be saved:', error);
            });
        } else {
            nameInput.style.borderColor = '#e74c3c';
            nameInput.placeholder = 'Please enter your name';
        }
    });

    // Skip name input
    skipBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Handle Enter key in name input
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });

    // Reset border color when typing
    nameInput.addEventListener('input', function() {
        this.style.borderColor = '#e0e0e0';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    function updateWelcomeMessage(name) {
        welcomeMessage.textContent = `Hi ${name}! Welcome to our website`;
    }
}

// Contact form functionality with validation
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    const successMessage = document.getElementById('formSuccess');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset previous error states
        clearErrors();
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            message: document.getElementById('message').value.trim()
        };

        // Validate form
        let isValid = true;
        
        // Name validation
        if (!formData.name) {
            showError('name', 'Name is required');
            isValid = false;
        } else if (formData.name.length < 2) {
            showError('name', 'Name must be at least 2 characters long');
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
            showError('name', 'Name can only contain letters and spaces');
            isValid = false;
        }

        // Email validation
        if (!formData.email) {
            showError('email', 'Email is required');
            isValid = false;
        } else if (!isValidEmail(formData.email)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Phone validation
        if (!formData.phone) {
            showError('phone', 'Phone number is required');
            isValid = false;
        } else if (!isValidPhone(formData.phone)) {
            showError('phone', 'Please enter a valid phone number');
            isValid = false;
        }

        // Date of birth validation
        if (!formData.dob) {
            showError('dob', 'Date of birth is required');
            isValid = false;
        } else if (!isValidDateOfBirth(formData.dob)) {
            showError('dob', 'Please enter a valid date of birth (must be at least 13 years old)');
            isValid = false;
        }

        // Gender validation
        if (!formData.gender) {
            showError('gender', 'Gender selection is required');
            isValid = false;
        }

        // Message validation
        if (!formData.message) {
            showError('message', 'Message is required');
            isValid = false;
        } else if (formData.message.length < 10) {
            showError('message', 'Message must be at least 10 characters long');
            isValid = false;
        } else if (formData.message.length > 1000) {
            showError('message', 'Message must be less than 1000 characters');
            isValid = false;
        }

        // If form is valid, submit to database
        if (isValid) {
            // Show loading state
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Submit to database
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    form.style.display = 'none';
                    successMessage.style.display = 'block';
                    
                    // Reset form after 5 seconds
                    setTimeout(() => {
                        form.reset();
                        form.style.display = 'block';
                        successMessage.style.display = 'none';
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }, 5000);
                } else {
                    throw new Error(data.error || 'Submission failed');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                showError('message', 'Failed to submit form. Please try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        }
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });

        input.addEventListener('input', function() {
            // Clear error state when user starts typing
            this.classList.remove('error');
            const errorElement = document.getElementById(this.id + 'Error');
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        });
    });

    function clearErrors() {
        const errorElements = form.querySelectorAll('.error-message');
        const inputElements = form.querySelectorAll('input, textarea');
        
        errorElements.forEach(error => error.classList.remove('show'));
        inputElements.forEach(input => input.classList.remove('error'));
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        
        field.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    function validateField(field) {
        const value = field.value.trim();
        const fieldId = field.id;
        
        switch (fieldId) {
            case 'name':
                if (!value) {
                    showError(fieldId, 'Name is required');
                } else if (value.length < 2) {
                    showError(fieldId, 'Name must be at least 2 characters long');
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    showError(fieldId, 'Name can only contain letters and spaces');
                }
                break;
                
            case 'email':
                if (!value) {
                    showError(fieldId, 'Email is required');
                } else if (!isValidEmail(value)) {
                    showError(fieldId, 'Please enter a valid email address');
                }
                break;
                
            case 'phone':
                if (!value) {
                    showError(fieldId, 'Phone number is required');
                } else if (!isValidPhone(value)) {
                    showError(fieldId, 'Please enter a valid phone number');
                }
                break;
                
            case 'dob':
                if (!field.value) {
                    showError(fieldId, 'Date of birth is required');
                } else if (!isValidDateOfBirth(field.value)) {
                    showError(fieldId, 'Please enter a valid date of birth (must be at least 13 years old)');
                }
                break;
                
            case 'gender':
                if (!field.value) {
                    showError(fieldId, 'Gender selection is required');
                }
                break;
                
            case 'message':
                if (!value) {
                    showError(fieldId, 'Message is required');
                } else if (value.length < 10) {
                    showError(fieldId, 'Message must be at least 10 characters long');
                } else if (value.length > 1000) {
                    showError(fieldId, 'Message must be less than 1000 characters');
                }
                break;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        // Remove all non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');
        // Check if it's a valid length (10-15 digits)
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    }
    
    function isValidDateOfBirth(dateString) {
        const birthDate = new Date(dateString);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Check if date is valid and user is at least 13 years old
        if (isNaN(birthDate.getTime())) {
            return false;
        }
        
        // Calculate exact age
        let actualAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            actualAge--;
        }
        
        // Must be at least 13 years old and not in the future
        return actualAge >= 13 && birthDate <= today;
    }
}

// Scroll effects and animations
function initializeScrollEffects() {
    // Header background change on scroll
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature, .vision-item, .value, .service, .contact-item');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add smooth scrolling for browsers that don't support it natively
if (!CSS.supports('scroll-behavior', 'smooth')) {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 70;
                smoothScrollTo(offsetTop, 800);
            }
        });
    });
}

function smoothScrollTo(target, duration) {
    const start = window.pageYOffset;
    const distance = target - start;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Add loading animation for images
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Add error handling for failed requests
window.addEventListener('error', function(e) {
    console.error('An error occurred:', e.error);
});

// Performance optimization: lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        const modal = document.getElementById('nameModal');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    }
});

// Add focus management for accessibility
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Initialize focus trap for modal
const modal = document.getElementById('nameModal');
if (modal) {
    trapFocus(modal);
}
