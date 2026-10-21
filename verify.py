from playwright.sync_api import sync_playwright
import os

os.makedirs('/home/jules/verification/screenshots', exist_ok=True)
os.makedirs('/home/jules/verification/videos', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(
        record_video_dir='/home/jules/verification/videos',
        viewport={'width': 1280, 'height': 800}
    )
    page = context.new_page()

    # Load app
    page.goto('http://localhost:3000')
    page.wait_for_timeout(2000)  # Wait for animation/hydration

    # Tab to the "Upload Image" dropzone (we might need a few tabs depending on the layout)
    # The first focusable might be the home button or navigation. Let's force focus using JS.
    page.evaluate('''() => {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.focus();
    }''')
    page.wait_for_timeout(500)

    page.screenshot(path='/home/jules/verification/screenshots/image_uploader_focus.png')

    # Switch to Text tab
    page.click('text="Paste Text"')
    page.wait_for_timeout(500)

    # Force focus on textarea
    page.evaluate('''() => {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
    }''')
    page.wait_for_timeout(500)

    page.screenshot(path='/home/jules/verification/screenshots/text_uploader_focus.png')

    context.close()
    browser.close()
