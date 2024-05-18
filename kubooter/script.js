function handleFile() {
    const file = document.getElementById('zipFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const username = document.getElementById('username').value;
            const repository = document.getElementById('repository').value;
            const token = document.getElementById('token').value;
            await extractZip(e.target.result, username, repository, token);
        };
        reader.readAsArrayBuffer(file);
    }
}

async function extractZip(zipData, username, repository, token) {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(zipData);
    const branch = 'main';

    for (const filename of Object.keys(zip.files)) {
        const fileData = await zip.files[filename].async('string');
        await uploadToGitHub(username, repository, filename, fileData, token, branch);
    }
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
        console.error(`Failed to upload ${filename}: ${response.statusText}`);
    } else {
        console.log(`Successfully uploaded ${filename}`);
    }
}
