document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    // Get form values
    const githubUsername = document.getElementById('githubUsername').value;
    const repositoryName = document.getElementById('repositoryName').value;
    const token = document.getElementById('token').value;
    const file = document.getElementById('file').files[0];

    // Initialize JSZip
    const zip = new JSZip();

    // Read the uploaded ZIP file
    zip.loadAsync(file)
    .then(function(contents) {
        const files = Object.keys(contents.files);

        // Calculate total size of files for progress calculation
        let totalSize = 0;
        files.forEach(function(filename) {
            totalSize += contents.files[filename].dir ? 0 : contents.files[filename]._data.uncompressedSize;
        });

        let uploadedSize = 0; // Initialize uploaded size for progress calculation

        // Iterate over files in the ZIP and upload each file
        files.forEach(function(filename) {
            if (!contents.files[filename].dir) {
                contents.files[filename].async('blob').then(function(blob) {
                    // Create form data
                    const formData = new FormData();
                    formData.append('file', blob, filename);

                    // Create and send the HTTP request to GitHub API to upload the file
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', `https://api.github.com/repos/${githubUsername}/${repositoryName}/contents/${filename}`);
                    xhr.setRequestHeader('Authorization', `token ${token}`);

                    // Update progress bar as the file is being uploaded
                    xhr.upload.addEventListener('progress', function(event) {
                        if (event.lengthComputable) {
                            uploadedSize += event.loaded;
                            const progress = Math.round((uploadedSize / totalSize) * 100);
                            document.getElementById('progressBar').style.width = `${progress}%`;
                        }
                    });

                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === XMLHttpRequest.DONE) {
                            if (xhr.status === 201) {
                                console.log(`File ${filename} uploaded successfully.`);
                            } else {
                                console.error(`Error uploading file ${filename}. Status: ${xhr.status}`);
                            }
                        }
                    };

                    // Send the request
                    xhr.send(formData);
                });
            }
        });
    });
});
