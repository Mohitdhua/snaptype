import asyncio
import json
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # We need a test in local storage to view the list
        test_data = [
            {
                "id": "test-id-123",
                "title": "Test Snippet",
                "text": "This is a test snippet for deletion.",
                "createdAt": "2024-01-01T12:00:00Z",
                "gameMode": "DIGITAL"
            }
        ]

        # Navigate to a dummy page to set local storage, then to the app
        await page.goto('http://localhost:3000')
        await page.evaluate(f"window.localStorage.setItem('snaptype_saved_tests_v1', '{json.dumps(test_data)}')")
        await page.reload()

        await page.wait_for_timeout(1000) # wait for hydration

        # Click the "Library" tab to show saved tests
        await page.click('text=Library')

        await page.wait_for_timeout(500)

        # Check initial state screenshot
        await page.screenshot(path='/home/jules/verification/screenshots/initial.png')

        # Click the delete button
        await page.click('button[title="Delete Test"]')
        await page.wait_for_timeout(200) # wait for render

        # Capture screenshot of confirmation state
        await page.screenshot(path='/home/jules/verification/screenshots/confirm.png')

        # Wait for timeout to revert
        await page.wait_for_timeout(3200)
        await page.screenshot(path='/home/jules/verification/screenshots/reverted.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
