from setuptools import setup

# to publish use:
# > python setup.py sdist upload
# which depends on ~/.pypirc

setup(name='iml',
      version='0.6.0',
      description='Interpretable Machine Learning (iML) package. Explain the predictions of any model.',
      url='http://github.com/interpretable-ml/iml',
      author='Scott Lundberg',
      author_email='slund1@cs.washington.edu',
      license='MIT',
      packages=['iml'],
      package_data={
        'iml': ['resources/*']
      },
      install_requires=['numpy', 'scipy', 'ipython', 'pandas'],
      test_suite='nose.collector',
      tests_require=['nose'],
      zip_safe=False)
