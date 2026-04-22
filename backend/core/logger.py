#logger
import logging
import sys

# Create a custom logger
logger = logging.getLogger("billboard_api")
logger.setLevel(logging.INFO) # Set to DEBUG for more verbosity during development

# Create handlers (Console output)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)

# Create formatters and add it to handlers
log_format = logging.Formatter('%(asctime)s - %(levelname)s - [%(module)s] - %(message)s')
console_handler.setFormatter(log_format)

# Add handlers to the logger
if not logger.hasHandlers():
    logger.addHandler(console_handler)
