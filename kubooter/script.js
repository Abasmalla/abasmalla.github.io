function handleFile() {
    const file = document.getElementById('zipFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const username = document.getElementById('username').value;
            const repository = document.getElementById('repository').value;
            const token = document.getElementById('token').value;
            if (!username || !repository || !token) {
                alert('Please enter all required fields.');
                return;
            }
            await extractZip(e.target.result, username, repository, token);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please select a zip file.');
    }
}

async function extractZip(zipData, username, repository, token) {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(zipData);
    const branch = 'main';
    const totalFiles = Object.keys(zip.files).length;
    let uploadedFiles = 0;

    document.getElementById('progress-container').style.display = 'block';

    for (const filename of Object.keys(zip.files)) {
        const fileData = await zip.files[filename].async('string');
        try {
            await uploadToGitHub(username, repository, filename, fileData, token, branch);
            uploadedFiles++;
        } catch (error) {
            alert(`Failed to upload ${filename}: ${error.message}`);
            console.error(`Failed to upload ${filename}: ${error.message}`);
        }
        updateProgress(uploadedFiles, totalFiles);
    }

    alert('Upload process complete.');
}

async function uploadToGitHub(username, repository, filename, content, token, branch) {
    const url = `https://api.github.com/repos/${username}/${repository}/contents/${filename}`;
    const base64Content = btoa(content);
    const message = `Upload ${filename}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            content: base64Content,
            branch: branch
        })
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    } else {
        console.log(`Successfully uploaded ${filename}`);
    }
}

function updateProgress(uploadedFiles, totalFiles) {
    const percentage = (uploadedFiles / totalFiles) * 100;
    document.getElementById('progress-bar').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${Math.round(percentage)}%`;
}
