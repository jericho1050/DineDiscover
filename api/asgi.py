from .index import app

# Only needed for AWS Lambda, but can help with other serverless platforms
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = app