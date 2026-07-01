from PIL import Image

# Path to the high-res app icon
icon_path = "/Users/aloksingh/.gemini/antigravity/brain/69241671-09ba-44d6-b2df-0f9edba42b14/play_store_icon_1782808339135.jpg"
icon = Image.open(icon_path)

# Create a new dark obsidian canvas (1024 x 500) matching our app theme
banner = Image.new("RGB", (1024, 500), (10, 12, 18))

# Resize our glassmorphic A logo to fit centered in the banner
logo_size = 380
logo = icon.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

# Calculate centering offsets
x_offset = (1024 - logo_size) // 2
y_offset = (500 - logo_size) // 2

# Paste the logo onto the canvas
banner.paste(logo, (x_offset, y_offset))

# Save the completed banner
banner.save("/Users/aloksingh/Raven/play_store_banner.png", "PNG")
print("Banner composed successfully!")
