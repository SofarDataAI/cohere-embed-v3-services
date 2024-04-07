FROM public.ecr.aws/docker/library/python:3.11-slim
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT=8090
WORKDIR /var/task
COPY requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py ./
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8090"]