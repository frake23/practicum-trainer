# 
FROM python:3.10

# 
WORKDIR /

# 
COPY . .

# 
RUN pip install --no-cache-dir --upgrade -r ./requirements.txt

# 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]